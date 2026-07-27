---
slice_id: 2022-10-22-0925
focus: "A rushed practice-management software transition piles onto Kelli's denial work; her testing warnings are overruled."
status: closed
start: "2022-10-22T09:25:00.000Z"
end: "2022-10-22T10:33:00.000Z"
timezone: America/Chicago
summary: "A rushed practice-management software transition is piled on top of Kelli's denial work. She pushes for payer-rule testing and parallel claim checks before go-live, but leadership compresses the timeline anyway. She is assigned the old-to-new queue mapping with barely enough training time. She plans a risk note split into three categories (build, workflow, payer-rule) and starts an issue log to track conversion defects."
decisions:
  - "Kelli is still revenue-cycle lead, but the rushed practice-management software transition added system-mapping and conve"
tags:
  - rushed-software-transition
  - payer-rule-testing-deferred
  - queue-mapping-risk
  - monica-wren-ally
  - workload-scope-creep
  - claim-issue-log
  - vendor-risk-documentation
  - parallel-claim-checks-denied
open_loops:
  - Risk note draft not yet completed
  - Post-go-live manual monitoring plan not yet approved
  - Conversion task log (separate from denial work) not yet started
  - Scope change communication to leadership not yet sent
emotional_tone: "negative"
---
## Turn 1 — 2022-10-22T09:25:00.000Z (user)

A lot has shifted again since we last talked, and this time it is work in a way I really do not love. I am still the revenue-cycle lead, but now a rushed practice-management software transition just got piled on top of the denial work I was already carrying. In the planning meeting I pushed hard for payer-rule testing before go-live, and I also argued we needed parallel claim checks against the old workflow so we could compare what the new system was doing. They compressed the timeline anyway, and now I am the one assigned to map the old work queues into the new system with barely enough training time to do it right.

## Turn 2 — 2022-10-22T09:27:00.000Z (agent)

That is a real shift, and it puts you in a rough position because you named the claim-risk issues up front and still got handed the responsibility afterward. What you were asking for was not nitpicking, it was basic protection against a messy launch. The combination of queue mapping, too little training, and a compressed go-live is exactly how avoidable billing errors get baked in early. The most useful move now may be to create a short written risk list so there is a record of what was not tested and what needs manual checking first.

## Turn 3 — 2022-10-22T09:30:00.000Z (user)

That is exactly why I am so wound up about it. I can already feel that this is becoming a second major workload on top of the denial cleanup, not just some side task for a week or two. They keep talking like queue mapping is administrative housekeeping, but those queues decide what gets touched, what gets held, and what disappears. Do you think I should push harder in writing now, or just focus on protecting the highest-risk claims and stop trying to win the argument I already lost?

## Turn 4 — 2022-10-22T09:34:00.000Z (agent)

I would stop trying to re-win the meeting and shift into documentation plus triage. A short email or memo is worth it, not to be dramatic, but to pin down that payer-rule testing and parallel claim checks were recommended and deferred, then list the first areas most likely to break if the mapping is off. Since you have already spent months building process discipline around denials, you have a good instinct for where downstream damage shows up first. Put your energy where bad setup turns into cash delay fastest.

## Turn 5 — 2022-10-22T09:36:00.000Z (user)

I can do that. The hardest part is that I do not even trust the training they gave us, because it was more like a guided demo than real hands-on work with our actual queues. I got assigned the old-to-new queue map because I know where the work really lives, but that almost makes it worse because now if something gets stranded everyone will look at me first. I am trying to figure out whether I should ask for a few days of protected testing time or whether that just gets laughed off at this point.

## Turn 6 — 2022-10-22T09:39:00.000Z (agent)

Ask for the protected testing time, but frame it as preventing stranded work rather than needing more comfort with the software. That keeps the focus on operations, not personal readiness. The fact that you were given too little training time is reason enough to request a limited hands-on validation window, especially for the queues that control holds, edits, and claim release. If they refuse, you will at least have made a very reasonable ask before the problems start showing up.

## Turn 7 — 2022-10-22T09:43:00.000Z (user)

That makes sense. I also keep thinking about the meeting itself, because I was not vague in there, I said specifically that payer behavior is where this falls apart if we treat go-live like a clean little IT milestone. I wanted parallel claim checks for a reason, so we could compare what the new system produced against the old workflow before launch instead of finding out from denials later. I hate being in the spot where I can already see the downstream mess and still have to help build it.

## Turn 8 — 2022-10-22T09:45:00.000Z (agent)

That is one of the clearer signs of your judgment, honestly. You were looking past the go-live story and into actual payer behavior and claim consequences, which is exactly the lens a lot of software rollouts are missing. And because the earlier denial improvements gave leadership confidence, they probably felt safe accelerating the conversion at Gem Valley Rural Health Network even though the testing was thin. I think it would help to separate, on paper, what is a build issue, what is a workflow issue, and what is a payer-rule issue so people cannot blur them together later.

## Turn 9 — 2022-10-22T09:48:00.000Z (user)

I like that three-bucket idea, because right now everything is already getting mushed together in conversation. Monica was one of the only people in the room who seemed to understand that I was not trying to stall things, I was trying to keep us from creating a receivables mess we could have predicted. There was a lot of pressure to sound positive and forward-moving, which is probably why my warnings landed like I was being difficult. Would you make that risk note pretty formal, or keep it plain and blunt?

## Turn 10 — 2022-10-22T09:52:00.000Z (agent)

Plain and blunt wins here. Formal enough that it reads like a business document, but simple enough that nobody can pretend they did not understand it. Since you have at least one ally with leadership, I would send it in a tone that says, here are the known exposure points, here is what can still be validated, and here is what will need manual monitoring after go-live. That gives supportive people something usable instead of just a warning cloud.

## Turn 11 — 2022-10-22T09:54:00.000Z (user)

That is helpful. Another pressure point is the clinic side, because I can already picture people getting impatient the second I ask for any extra review step that slows flow. One of the physicians has always respected that I know payer rules, but he gets irritated fast if billing changes create friction for the clinic. I am trying to think ahead about where the pushback will come from first, and I do not want to get trapped defending every caution step one at a time.

## Turn 12 — 2022-10-22T09:57:00.000Z (agent)

You are probably right to expect friction from the clinic side first, because extra validation feels invisible when it is working and annoying when it is not. It may help to present only two or three non-negotiable checks instead of a long caution list, the ones most likely to stop claims from vanishing or going out wrong. People tolerate slowdown better when they can see a direct reason for it. If you had to pick the top checks, which ones feel most dangerous to skip?

## Turn 13 — 2022-10-22T10:01:00.000Z (user)

Top of the list would be work queues tied to claim holds and edits, then anything that affects auth follow-up, and then a sample of claims by payer to see whether the rules are firing the way they should. If those are wrong, the whole thing gets distorted before anyone even knows where to look. I am also thinking I may call Shawna tonight, because she is one of the few people who would understand why a queue map can make my stomach hurt. Is it worth venting first, or should I draft while I am still irritated and clear?

## Turn 14 — 2022-10-22T10:03:00.000Z (agent)

Those priorities are solid, and they show you are thinking in failure points, not busywork. I would do a quick rough draft first while the specifics are sharp, then call Shawna after so the venting does not replace the usable record. Even fifteen messy bullet points is enough to capture what the risks actually are before the evening turns into replaying the meeting. Then the call can help you cool down instead of carrying the whole burden of organizing it.

## Turn 15 — 2022-10-22T10:06:00.000Z (user)

That order probably would keep me from spiraling. The thing I keep coming back to is how exposed this feels, because I was overruled after raising concrete concerns, but if the rollout stumbles I will still be attached to it because I am the one doing the mapping and conversion oversight. It is such a specific kind of frustration to be responsible for something you do not think is ready. I am not sure whether I should say that out loud to anybody, or just let the written notes do the talking.

## Turn 16 — 2022-10-22T10:10:00.000Z (agent)

I would let the notes carry most of that message, because written specifics land better than saying, this is not ready, in a room that already chose speed. But there is nothing wrong with one calm sentence to the right person saying you want expectations aligned, since your role now includes both queue mapping and conversion oversight. That is not complaining, it is clarifying responsibility. You are trying to prevent the very common setup where the risk warning gets forgotten and the cleanup person gets blamed later.

## Turn 17 — 2022-10-22T10:12:00.000Z (user)

Yes, expectation setting is the phrase I can probably live with. I do not want to sound defensive before anything has even broken, but I also do not want everyone acting surprised if bad mapping creates weird downstream claim behavior. Monica is probably the person I can say that to most directly. Do you think I should ask her to back a short post-go-live manual monitoring plan too, or is that asking for too much while they are still pretending this is smooth?

## Turn 18 — 2022-10-22T10:15:00.000Z (agent)

Ask for it, but keep it narrow and time-limited. A short post-go-live manual monitoring plan sounds reasonable, not alarmist, if you tie it to a few high-risk queue and payer checks for the first stretch. That also gives your ally a concrete way to support you instead of just agreeing in principle. I would pitch it as temporary stabilization, not a shadow system.

## Turn 19 — 2022-10-22T10:19:00.000Z (user)

Temporary stabilization is good language. I can hear them rejecting anything that sounds like I am trying to recreate the old workflow forever, but a short window of side-by-side checking is exactly what I wanted from the start. I am realizing part of what bothers me is that this changes my job again, because now I am still leading the denial work, but I also have this conversion oversight sitting on top of it whether I wanted it or not. That part feels bigger than just one bad meeting.

## Turn 20 — 2022-10-22T10:21:00.000Z (agent)

It is bigger than one meeting. Your role just expanded in a very real way, and not through a clean promotion or a carefully planned handoff, but through a risky transition that got attached to the work you were already carrying. That matters because it changes how you need to protect your time and how clearly responsibilities should be named. I think you should treat this as a scope change and keep a running list of conversion tasks that are displacing your normal revenue-cycle work.

## Turn 21 — 2022-10-22T10:24:00.000Z (user)

I had not thought of tracking it as scope change, but that actually helps me mentally. If I list the conversion tasks separately, then I can show what is getting pushed or delayed instead of just feeling like I am failing to keep all the plates spinning. I am also wondering if I should set up my own little log of issues by category from day one, almost like I am preparing future evidence. Does that sound smart or too cynical?

## Turn 22 — 2022-10-22T10:28:00.000Z (agent)

That sounds smart. A simple issue log by category is not cynical, it is how you keep pattern from turning into fog. If you track the date, the queue or payer involved, what was expected, what happened instead, and whether it was build, workflow, or rule-related, you will be able to spot trends fast and speak with much more authority. It also protects your attention, because you will not have to hold every problem in your head at once.

## Turn 23 — 2022-10-22T10:30:00.000Z (user)

Okay, that gives me a path. Tonight I am going to rough out the risk note, split it into those three categories, and ask for a narrow testing and monitoring window instead of making some grand stand about the whole conversion. Then I will start an issue log so this new layer of work is visible and not just absorbed into my regular job. I still hate that I saw the risk and got overruled, but at least I know what I am doing next.

## Turn 24 — 2022-10-22T10:33:00.000Z (agent)

That is a strong plan, and it fits the reality you are in instead of the version you wish they had chosen. You are turning a bad setup into documented risk, limited safeguards, and clearer boundaries around a job that just got broader. Even if leadership keeps pushing speed, you will have created structure where there was mostly pressure and optimism. That will help both in the first chaotic stretch and later, when people start asking what actually happened.
