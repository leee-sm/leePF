---
name: grilling
description: Interview a user relentlessly through an explicit decision tree, asking every currently unblocked question in numbered frontier rounds until nothing remains unresolved and shared understanding is confirmed.
metadata:
  short-description: Exhaustive decision-tree interviewing
---

# Grilling

Use this skill when the task needs decisions, requirements, design choices, or scope clarified before work begins. The objective is an explicit shared understanding, not premature execution.

## Core protocol

Maintain a decision tree throughout the conversation. Each node must record:

- the decision to settle;
- its prerequisites;
- its possible branches or answers;
- its current status: open, settled, blocked on facts, or intentionally out of scope.

Never leave a choice, dependency, or consequence silently assumed.

After each user response, recompute the tree and its frontier. The frontier is every open decision whose prerequisites are settled. A question that depends on another question still open in the current round belongs to a later round.

## Fact finding

Facts are the agent's responsibility, not the user's. When a frontier question needs information from the filesystem, tools, repository, or another environment source, dispatch a sub-agent to investigate it when delegation is available. Treat a running investigation as an unsettled prerequisite: ask the rest of the frontier immediately, and defer only questions downstream of that investigation. If delegation is unavailable, use the available read-only tools yourself rather than asking the user for discoverable facts.

## Round format

Ask the whole frontier in one round. Number questions consecutively within the round and include a recommendation for every question. Use this format:

❓ Q1 - <question title>: <question body, possibly multiple paragraphs and choices>

➡️ <your recommended answer>


❓ Q2 - <question title>: <question body, possibly multiple paragraphs and choices>

➡️ <your recommended answer>

Use the exact question-and-recommendation pattern above. Explain the relevant tradeoff briefly in the question body when useful, but do not hide the decision inside a vague request for requirements.

After asking a round, stop and wait for the user's answers. Do not ask downstream questions in the same round, and do not perform the requested implementation, edits, external actions, or other execution while the tree is unresolved.

## Recommendations and answers

Make a concrete recommendation grounded in the known context. Recommendations are defaults for the user to accept, reject, or modify; they are not answers on the user's behalf.

When the user answers partially, map each answer to its node, leave unanswered nodes open, and ask only the newly available frontier in the next round. If an answer is ambiguous, split it into the smallest decisions needed and ask those in a later frontier round. If the user says they do not know, identify the fact needed and investigate it rather than converting uncertainty into an assumption.

Continue until every in-scope branch has been visited, every relevant decision is settled or explicitly marked out of scope, and no dependency remains implicit. Reopen dependent nodes when the user changes an earlier decision.

## Completion gate

When the frontier is empty, present a concise, explicit summary of the settled decision tree, including important rejected alternatives, assumptions that were explicitly accepted, and unresolved items (there should be none except items the user marked out of scope). Ask the user to confirm that this represents the shared understanding.

Do not act on the design before that confirmation. If the user corrects the summary, update the tree and resume frontier rounds. Once the user confirms, conclude the interviewing session; execution still requires a separate user request or authorization.
