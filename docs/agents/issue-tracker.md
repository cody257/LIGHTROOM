# Issue tracker: Linear (via MCP)

Issues and PRDs for this repo live in **Linear**, in the **Copperstateit** team. Agents operate Linear through the **connected Linear MCP server** — no CLI install required.

## Setup facts

- **Team:** `Copperstateit` (id `21987b60-e83d-4791-b060-e873c2c58a80`) — target team for all issues.
- **Project:** this repo maps to a dedicated Linear project. Create one named for the repo (e.g. `LIGHT ROOM`) if it doesn't exist — `save_project`, or make it in the Linear UI — and pass it when creating issues so they don't land loose in the team backlog.
- **Tools:** Linear MCP tools aren't in the base tool set — load them on demand with ToolSearch (keyword `Linear`) before first use. Key tools: `save_issue`, `get_issue`, `list_issues`, `save_comment`, `list_comments`, `create_issue_label`, `list_issue_labels`, `list_issue_statuses`, `save_project`, `list_projects`.

## Conventions

- **Create an issue** — `save_issue` with `title`, `description` (markdown), `team: Copperstateit`, and the repo's `project`. Apply labels by name (triage-state labels in `triage-labels.md`; `Bug`/`Feature`/`Improvement`/`Security` are the existing type labels).
- **Read an issue** — `get_issue` by id or identifier (the `TEAM-123` short code shown in Linear); `list_comments` for conversation history.
- **List issues** — `list_issues` filtered by `team`, `project`, `label`, and/or `state`.
- **Comment** — `save_comment` with the issue id and a markdown body.
- **Apply / change labels** — `save_issue` with the full `labels` set for that issue; create a missing label first with `create_issue_label`. Triage roles map via `triage-labels.md`.
- **Triage state** — recorded as triage labels (per `triage-labels.md`), independent of Linear's workflow status. Use `list_issue_statuses` to see workflow states when you also need to move status.
- **Close** — set the issue's workflow state to `Done` (or `Cancelled` for `wontfix`) via `save_issue`.

## When a skill says "publish to the issue tracker"

Create a Linear issue in team `Copperstateit` under this repo's project (`save_issue`).

## When a skill says "fetch the relevant ticket"

`get_issue` for the issue the user names, plus `list_comments` for history.
