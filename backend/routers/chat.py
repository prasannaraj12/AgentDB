import json
import asyncio
import logging
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory conversation history per session
conversation_histories: dict = {}


class ChatRequest(BaseModel):
    message: str
    session_id: str = "default_session"


class ChatResponse(BaseModel):
    response: str
    message_type: str = "text"
    trace: list = []


def extract_trace(messages):
    trace = []
    for msg in messages:
        msg_type = type(msg).__name__
        if msg_type == "AIMessage" and hasattr(msg, "tool_calls") and msg.tool_calls:
            for tc in msg.tool_calls:
                trace.append({
                    "step": "tool_call",
                    "tool": tc.get("name", ""),
                    "input": tc.get("args", {})
                })
        elif msg_type == "ToolMessage":
            content = msg.content
            if isinstance(content, list):
                content = "".join(b.get("text", "") for b in content if isinstance(b, dict))
            trace.append({
                "step": "tool_result",
                "tool": getattr(msg, "name", ""),
                "output": content
            })
    return trace


def collect_rich_blobs(all_messages: list) -> dict:
    """Collect chart/mermaid/explanation blobs from ToolMessages, deduplicated by type."""
    RICH_TOOLS = {"tool_generate_chart", "tool_generate_flowchart", "tool_explain_data"}
    rich_by_type = {}
    for msg in all_messages:
        if type(msg).__name__ != "ToolMessage":
            continue
        tool_name = getattr(msg, "name", "")
        if tool_name not in RICH_TOOLS:
            continue
        content = msg.content
        if isinstance(content, list):
            content = "".join(b.get("text", "") for b in content if isinstance(b, dict))
        content = content.strip()
        if not content:
            continue
        try:
            obj = json.loads(content)
            t = obj.get("type")
            if t in ("chart", "mermaid", "explanation"):
                rich_by_type[t] = content
        except Exception:
            if tool_name == "tool_explain_data":
                rich_by_type["explanation"] = json.dumps({"type": "explanation", "content": content})
    return rich_by_type


def remove_rich_blobs(text: str) -> str:
    """Strip rich JSON blobs and tool wrapper blobs from text."""
    import re
    text = re.sub(
        r'\{["\']tool_\w+_response["\']\s*:\s*\{.*?\}\s*\}',
        '', text, flags=re.DOTALL
    )
    out, i, n = [], 0, len(text)
    while i < n:
        if text[i] == '{':
            depth, j, in_str, esc = 0, i, False, False
            while j < n:
                c = text[j]
                if esc:
                    esc = False
                elif c == '\\' and in_str:
                    esc = True
                elif c == '"':
                    in_str = not in_str
                elif not in_str:
                    if c == '{':
                        depth += 1
                    elif c == '}':
                        depth -= 1
                        if depth == 0:
                            break
                j += 1
            raw = text[i:j + 1]
            try:
                obj = json.loads(raw)
                t = obj.get("type")
                if t in ("chart", "mermaid", "explanation"):
                    i = j + 1
                    continue
                if "output" in obj or "error" in obj:
                    i = j + 1
                    continue
                if any(isinstance(v, list) for v in obj.values()):
                    i = j + 1
                    continue
            except Exception:
                pass
            out.append(text[i])
            i += 1
        else:
            out.append(text[i])
            i += 1
    return "".join(out)


@router.post("", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    from agent import get_agent_executor, get_rag_context
    try:
        executor = get_agent_executor()
        history = conversation_histories.get(request.session_id, [])

        rag_context = get_rag_context(request.message)
        rag_msg = ("system", f"Most relevant tables for this query:\n{rag_context}") if rag_context else None
        messages_input = history + ([rag_msg] if rag_msg else []) + [("user", request.message)]

        result = executor.invoke({"messages": messages_input})
        all_messages = result["messages"]
        raw_content = all_messages[-1].content

        if isinstance(raw_content, list):
            output_str = "".join(block.get("text", "") for block in raw_content if isinstance(block, dict))
        else:
            output_str = raw_content

        rich_by_type = collect_rich_blobs(all_messages)
        clean_text = remove_rich_blobs(output_str).strip()
        for blob in rich_by_type.values():
            clean_text = clean_text + "\n" + blob

        history.append(("user", request.message))
        history.append(("assistant", clean_text))
        conversation_histories[request.session_id] = history[-20:]

        trace = extract_trace(all_messages)
        return ChatResponse(response=clean_text, message_type="agent_response", trace=trace)
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return ChatResponse(response=f"An error occurred: {str(e)}", message_type="error")


@router.delete("/{session_id}")
async def clear_history(session_id: str):
    conversation_histories.pop(session_id, None)
    return {"message": "History cleared"}


@router.post("/stream")
async def chat_stream(request: ChatRequest):
    async def generate():
        try:
            from agent import get_agent_executor, get_rag_context
            executor = get_agent_executor()
            history = conversation_histories.get(request.session_id, [])

            rag_context = get_rag_context(request.message)
            rag_msg = ("system", f"Most relevant tables for this query:\n{rag_context}") if rag_context else None
            messages_input = history + ([rag_msg] if rag_msg else []) + [("user", request.message)]

            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(None, lambda: executor.invoke({"messages": messages_input}))
            all_messages = result["messages"]
            raw_content = all_messages[-1].content

            if isinstance(raw_content, list):
                output_str = "".join(block.get("text", "") for block in raw_content if isinstance(block, dict))
            else:
                output_str = raw_content

            rich_by_type = collect_rich_blobs(all_messages)
            clean_text = remove_rich_blobs(output_str).strip()

            words = clean_text.split(" ")
            for i, word in enumerate(words):
                chunk = word + (" " if i < len(words) - 1 else "")
                yield "data: " + json.dumps({"type": "token", "value": chunk}) + "\n\n"
                await asyncio.sleep(0.03)

            for blob in rich_by_type.values():
                yield "data: " + json.dumps({"type": "rich", "value": blob}) + "\n\n"

            full_output = clean_text + "\n" + "\n".join(rich_by_type.values())
            history.append(("user", request.message))
            history.append(("assistant", full_output))
            conversation_histories[request.session_id] = history[-20:]

            trace = extract_trace(all_messages)
            yield "data: " + json.dumps({"type": "done", "trace": trace}) + "\n\n"

        except Exception as e:
            logger.error(f"Stream error: {e}")
            yield "data: " + json.dumps({"type": "error", "value": str(e)}) + "\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )
