export interface InitiativeStep {
    title: string;
    description: string;
}

export interface Initiative {
    id: string;
    title: string;
    icon: string;
    accentColor: string;
    summary: string;
    businessValue: string[];
    deliverables: InitiativeStep[];
    technicalSteps: string[];
    champions?: string[];
    successMetric: string;
}

export const initiatives: Initiative[] = [
    {
        id: 'ai-tax-agent',
        title: 'AI Tax Agent',
        icon: 'Bot',
        accentColor: 'purple',
        summary:
            'An AI-powered agent that monitors TTT\'s mailboxes and WhatsApp business number, automatically fetches all incoming client documents, and stores them against the correct case in the CRM. The agent performs OCR on key documents like the IRP5 and ITA34, extracting structured data so consultants don\'t have to manually capture it.',
        businessValue: [
            'Tax consultants start every return with all client documents already organised on the case, no chasing, no missing docs',
            'OCR on IRP5 and ITA34 eliminates manual data capture, reducing errors and saving hours per return',
            'Documents from both email and WhatsApp are automatically routed to the right case, so nothing gets lost in inboxes',
            'Consultants can focus on advisory and review instead of admin, higher value work and faster turnaround',
            'Clients experience a seamless handoff: they send docs once, and TTT already has everything when they start',
        ],
        deliverables: [
            {
                title: 'Mailbox Integration',
                description:
                    'Connect the AI agent to TTT\'s email mailboxes so it can monitor incoming messages, identify client documents (attachments), and match them to the correct CRM case using client identifiers like ID numbers or case references.',
            },
            {
                title: 'WhatsApp Document Ingestion',
                description:
                    'Extend the agent to listen for documents sent to the WhatsApp business number. Photos, PDFs, and scanned documents sent by clients on WhatsApp are captured and routed to their CRM case automatically.',
            },
            {
                title: 'OCR on IRP5 & ITA34',
                description:
                    'Implement optical character recognition specifically trained for IRP5 and ITA34 document formats. Extract key fields (income, tax paid, deductions, employer details) into structured data that can pre-populate the tax return.',
            },
            {
                title: 'CRM Case Document Storage',
                description:
                    'Build the document storage structure on each CRM case so all fetched documents are organised by type (IRP5, ITA34, bank statements, medical certificates, etc.) with clear labelling and timestamps.',
            },
            {
                title: 'Agent Monitoring & Error Handling',
                description:
                    'Create a simple dashboard for ops to see the agent\'s activity, documents processed, cases matched, OCR results, and any items that need manual review (e.g. unmatched documents or low-confidence OCR).',
            },
        ],
        technicalSteps: [
            'Set up email API integration (IMAP/Graph API) to monitor TTT mailboxes for incoming client documents',
            'Build WhatsApp Business API listener for document messages (images, PDFs) and link to CRM client records',
            'Implement document classification model to identify document types (IRP5, ITA34, bank statement, etc.)',
            'Deploy OCR pipeline specifically tuned for South African tax documents (IRP5, ITA34 formats)',
            'Build CRM API integration to create document records against client cases with correct categorisation',
            'Create matching logic to link incoming documents to the correct client/case using ID numbers, names, or case refs',
            'Set up error queue for unmatched or low-confidence documents that need manual review',
        ],
        successMetric:
            'All incoming client documents from email and WhatsApp are automatically captured on the correct CRM case. OCR extracts structured data from IRP5 and ITA34 with high accuracy, reducing manual capture time per return.',
    },
    {
        id: 'whatsapp',
        title: 'WhatsApp',
        icon: 'MessageCircle',
        accentColor: 'emerald',
        summary:
            'WhatsApp becomes the primary channel for client interaction across TTT. The experience must be different depending on who is messaging, existing clients get full self-service tools, leads get guided toward completing their sign-up, and brand new contacts are directed to a service selection form. Each department has specific tools available within WhatsApp so clients can get what they need without calling or emailing.',
        businessValue: [
            'Clients can self-serve most queries directly on WhatsApp like case status, invoices, claims, and bookings, reducing call and email volume',
            'Leads who haven\'t completed sign-up get nudged toward their outstanding documents or signing links, improving conversion rates',
            'New contacts are immediately captured with a signup form and routed to the correct department, so no lead falls through the cracks',
            'Department-specific tools mean each division (Tax, Insurance, Accounting, FA) gets a tailored experience for their clients',
            'WhatsApp is where clients already are, meeting them there creates a modern, accessible experience that builds loyalty',
        ],
        deliverables: [
            {
                title: 'Existing Client Path',
                description:
                    'When an existing client messages, the system identifies them via their phone number and CRM record. They get access to department-specific tools: Tax clients can ask for case status, download invoices, and get tax queries answered. Insurance clients can submit claims with photos. FA clients can ask questions and book advisory calls. Accounting clients can check their account status. All powered by AI querying the CRM in real-time.',
            },
            {
                title: 'Lead Path',
                description:
                    'When a known lead messages, the system checks what\'s outstanding like unsigned documents or incomplete onboarding steps. The lead is directed to complete those actions, sent the documents they still need to sign, given a direct link to the signing page, or guided through remaining steps. Once everything is complete, the lead auto-converts to a client in the CRM.',
            },
            {
                title: 'New Contact Path',
                description:
                    'When a completely new number messages, they are greeted and directed to a sign-up form where they select the service they\'re interested in (Tax, Insurance, Accounting, or Financial Advisory) and provide their details. This creates a new lead in the CRM and notifies the relevant TTT team that a new lead has been created.',
            },
            {
                title: 'Department Tools (Tax)',
                description:
                    'Tax clients can ask about their case status, request their latest invoice, query their tax return details, and get answers to common tax questions, all within WhatsApp using AI that queries the CRM for their specific data.',
            },
            {
                title: 'Department Tools (Insurance)',
                description:
                    'Insurance clients can submit new claims by sending photos and descriptions directly via WhatsApp. They can also check claim status and ask questions about their cover.',
            },
            {
                title: 'Department Tools (Financial Advisory)',
                description:
                    'FA clients can ask questions about their portfolio or financial plan, and the system can book advisory calls on their behalf by checking advisor availability.',
            },
        ],
        technicalSteps: [
            'Set up WhatsApp Business API with the TTT business number and configure webhook handlers for incoming messages',
            'Build client identification layer to match incoming phone numbers against CRM contacts and determine if they are a client, lead, or new contact',
            'Create the routing engine that directs conversations to the correct path (client / lead / new contact) based on CRM lookup',
            'Build the sign-up form flow for new contacts with service selection (Tax, Insurance, Accounting, FA) and lead creation in CRM',
            'Implement lead status checker that identifies outstanding actions (unsigned docs, incomplete steps) and sends the right prompts',
            'Build AI query layer that can retrieve client-specific data from CRM (case status, invoices, tax details, insurance claims)',
            'Create department-specific tool functions: tax status lookup, invoice retrieval, claim submission with photo upload, FA call booking',
            'Integrate with Quickly Sign for sending signing links directly within WhatsApp conversations',
            'Set up auto-conversion logic: when a lead completes all outstanding steps, automatically convert them to a client in the CRM',
        ],
        champions: ['Andrew (FA)', 'Tori (Tax)', 'James (Accounting)', 'Netasha (Insurance)'],
        successMetric:
            '30% of active clients with at least one inbound WhatsApp interaction. Leads are guided to completion with measurable conversion uplift. New contacts are captured immediately and routed to the right team.',
    },
    {
        id: 'accounting-lead-management',
        title: 'Accounting Lead Management',
        icon: 'Calculator',
        accentColor: 'blue',
        summary:
            'Build a structured lead management pipeline for the Accounting department so every lead is tracked from first contact through to converted client. Currently, accounting leads can slip through the cracks because there\'s no consistent process to capture, follow up, and convert them. This initiative creates that system inside the CRM with clear stages, accountability, and reporting.',
        businessValue: [
            'Every accounting lead is captured and tracked in a single pipeline, nothing gets lost in emails or spreadsheets',
            'Clear lead stages (new → contacted → proposal sent → signed → onboarded) give the team and management visibility into the pipeline',
            'Automated follow-up reminders ensure no lead goes cold without deliberate action',
            'Management gets a clear view of conversion rates and can identify where leads are dropping off',
            'A structured pipeline makes it easy to scale, as lead volume grows the process stays consistent',
        ],
        deliverables: [
            {
                title: 'Lead Pipeline Setup in CRM',
                description:
                    'Configure the accounting lead pipeline in the CRM with defined stages: New Lead → First Contact → Needs Assessment → Proposal Sent → Follow-Up → Signed → Onboarded. Each stage has clear entry criteria and expected actions.',
            },
            {
                title: 'Lead Capture from All Channels',
                description:
                    'Ensure accounting leads from all sources (WhatsApp, website, referrals, walk-ins, internal cross-referrals from Tax/FA/Insurance) are captured in the pipeline. Includes integration with the WhatsApp new contact flow and any web forms.',
            },
            {
                title: 'Automated Follow-Up & Reminders',
                description:
                    'Set up automated reminders when a lead has been in a stage too long without action. Notify the responsible team member and escalate if SLAs are breached. This ensures consistent follow-up cadence.',
            },
            {
                title: 'Pipeline Reporting & Conversion Tracking',
                description:
                    'Build a simple dashboard showing the accounting pipeline: how many leads at each stage, conversion rates between stages, average time-to-close, and individual team member performance.',
            },
        ],
        technicalSteps: [
            'Configure lead pipeline stages and custom fields in the CRM for accounting-specific lead data',
            'Build lead capture integrations from WhatsApp (new contact flow), website forms, and internal referral workflow',
            'Set up automation rules for stage-based reminders and SLA breach escalations',
            'Create pipeline dashboard with stage counts, conversion funnels, and time-in-stage metrics',
            'Implement lead assignment logic so new leads are routed to the right team member based on capacity or region',
        ],
        champions: ['James (Accounting)'],
        successMetric:
            'All accounting leads are captured in a single CRM pipeline with full visibility. Conversion rates from lead to signed client are tracked and improving month-over-month.',
    },
    {
        id: 'fa-lead-generation',
        title: 'FA Lead Generation',
        icon: 'Target',
        accentColor: 'red',
        summary:
            'Use existing TTT client data, especially from the tax base, to automatically identify and surface high-potential Financial Advisory opportunities. Instead of relying on ad-hoc referrals, we build rules-based automations that analyse client data and flag likely FA prospects. The FA team gets a steady pipeline of warm leads from clients TTT already knows and serves.',
        businessValue: [
            'Turns the existing tax client base into a growth engine for FA, no new client acquisition cost, these are people TTT already serves',
            'Rules-based scoring replaces guesswork, every client is evaluated consistently against clear criteria',
            'FA advisors spend their time on qualified, warm leads instead of cold outreach, improving close rates',
            'Cross-selling deepens client relationships, clients get more holistic financial services from a firm they already trust',
            'The system gets smarter over time as the FA team validates which leads convert and which don\'t',
        ],
        deliverables: [
            {
                title: 'Define Scoring Rules',
                description:
                    'Work with the FA team to define the rules that indicate a client is a good FA prospect. Key signals include: high tax return values, high-income individuals, clients not maximising their RA contributions, clients without life cover, clients with large lump-sum payouts, and other indicators from tax data.',
            },
            {
                title: 'Automated Data Scanning',
                description:
                    'Build automations that scan the existing client database against the defined rules. When a client matches one or more criteria, they are flagged as a potential FA lead with a score based on how many rules they match and the strength of each signal.',
            },
            {
                title: 'FA Lead Queue',
                description:
                    'Create a dedicated lead queue for the FA team in the CRM showing all scored leads, ranked by likelihood. Each lead card shows the client\'s name, which rules they matched, their score, and a summary of the relevant data points so the advisor has context before reaching out.',
            },
            {
                title: 'Validation & Feedback Loop',
                description:
                    'FA advisors validate each lead (accept or reject with a reason). These outcomes feed back into the scoring rules so the system can be tuned over time, rules that produce good leads get weighted higher, rules that produce poor leads get adjusted.',
            },
        ],
        technicalSteps: [
            'Map available client data fields in the CRM that are relevant to FA scoring (income, RA contributions, life cover status, tax return values, etc.)',
            'Build the scoring rules engine with configurable rules and weights that can be adjusted without code changes',
            'Create automated pipeline that scans the client base on a schedule and scores/flags qualifying leads',
            'Build the FA lead queue view in the CRM with filtering, sorting by score, and lead detail views',
            'Implement the validation workflow: accept/reject actions with feedback capture',
            'Set up reporting: leads generated per month, validation rates, conversion to FA client, rule effectiveness',
        ],
        champions: ['Andrew (FA)'],
        successMetric:
            '1,000 validated FA leads generated from existing client data in 2026. Rules are tuned based on FA team feedback, with conversion rates improving quarter-over-quarter.',
    },
    {
        id: 'digital-compliance',
        title: 'Digital Compliance',
        icon: 'FileCheck',
        accentColor: 'yellow',
        summary:
            'Integrate Quickly Sign into the CRM so any team member can send a client a digital document for signing directly from the place where they are servicing that client. No switching between systems, no downloading and uploading, just a simple action from the client\'s CRM record that sends the document via email or WhatsApp and tracks the signing status in real-time.',
        businessValue: [
            'Team members can send documents for signing from exactly where they work in the CRM, no context switching or extra tools',
            'Clients receive signing links via their preferred channel (email or WhatsApp) and can sign on any device, anywhere',
            'Real-time tracking means the team always knows the status: sent → viewed → signed, with no need to follow up manually',
            'Reduces turnaround time from days to hours, digital signing removes printing, posting, and scanning delays',
            'Creates an auditable, timestamped compliance trail for every signed document',
        ],
        deliverables: [
            {
                title: 'Quickly Sign CRM Integration',
                description:
                    'Integrate the Quickly Sign API with the CRM so documents can be generated, sent, and tracked without leaving the CRM. The integration must be accessible from the client record, the case view, and any other context where the team is servicing a client.',
            },
            {
                title: 'User-Friendly Sending Actions',
                description:
                    'Build simple, clear actions in the CRM for sending documents. The team member selects the document type, the client is pre-populated, and they choose email or WhatsApp delivery. One click to send. The action must feel natural from whichever screen they are on, whether that\'s the client record, case, or lead.',
            },
            {
                title: 'Document Templates',
                description:
                    'Set up document templates in Quickly Sign (LOEs, consent forms, approvals, audit letters) with dynamic fields that auto-populate from CRM data (client name, ID, engagement terms, fees). This removes manual editing and ensures consistency.',
            },
            {
                title: 'Status Tracking & Reminders',
                description:
                    'Show real-time signing status on the CRM record: sent, viewed, signed, expired. Automated reminders go out to clients who haven\'t signed after 24 hours, 3 days, and 7 days. Team members get notified when a document is signed.',
            },
            {
                title: 'Compliance Reporting',
                description:
                    'Dashboard showing signing rates by document type and division, average time-to-sign, and documents approaching or past SLA. This gives management visibility into the digital compliance target.',
            },
        ],
        technicalSteps: [
            'Integrate Quickly Sign API into the CRM backend for document creation, sending, status webhooks, and signed document storage',
            'Build CRM UI components: "Send for Signing" button available on client records, case views, and lead views',
            'Create document template system with dynamic field mapping from CRM data',
            'Implement WhatsApp delivery channel for signing links using the WhatsApp Business API',
            'Set up webhook listeners for signing events (viewed, signed, expired) and update CRM records in real-time',
            'Build automated reminder sequences for unsigned documents (24hr, 3-day, 7-day)',
            'Create compliance reporting dashboard with division breakdowns and SLA tracking',
        ],
        successMetric:
            '70% of in-scope documents signed digitally within SLA. Team members can send documents from the CRM in under 30 seconds with no system switching.',
    },
    {
        id: 'training-plan',
        title: 'Training Plan',
        icon: 'GraduationCap',
        accentColor: 'purple',
        summary:
            'A clear, structured training model built around department champions. Each department has a designated person who riivo trains directly and consistently as new features are developed. These champions then train their own teams. riivo also conducts in-person department-wide sessions when visiting the offices, but between visits the champions are responsible for keeping their teams up to speed.',
        businessValue: [
            'Training happens continuously alongside development, not as an afterthought once features are already live',
            'Champions become the go-to people in each department, reducing dependency on riivo for day-to-day questions',
            'Department-wide sessions are more effective in person, so we save those for when riivo is on-site and maximise the impact',
            'Each department gets training tailored to their specific workflows and tools, not generic group sessions',
            'Consistent training means the team actually uses the tools we build, which is the difference between building something and getting value from it',
        ],
        deliverables: [
            {
                title: 'Assign Department Champions',
                description:
                    'Confirm the champion for each department: Andrew (FA), Tori (Tax), James (Accounting), Netasha (Insurance). These are the people riivo works with directly during the build cycle for each initiative.',
            },
            {
                title: 'Champion Training Cadence',
                description:
                    'Set up a recurring schedule where riivo trains the relevant champion(s) on whatever is being developed that month. This happens via direct calls or chats and is focused on the specific features being built, how they work, and how the department will use them.',
            },
            {
                title: 'Champion-Led Team Training',
                description:
                    'After being trained, each champion is responsible for rolling out the knowledge to their team members. This can be informal walkthroughs, team meetings, or one-on-one sessions depending on what works for the department.',
            },
            {
                title: 'In-Person Department Sessions',
                description:
                    'When riivo visits the offices, schedule department-wide training sessions. These are the most effective format for hands-on training and Q&A, but they depend on riivo being physically present so they happen less frequently.',
            },
            {
                title: 'Monthly Focus Alignment',
                description:
                    'At the start of each month, align on which initiatives are being developed and which champions need to be looped in. This keeps training tightly connected to what is actually being built and avoids training on things that aren\'t ready yet.',
            },
        ],
        technicalSteps: [
            'Create a shared training calendar with champion sessions and in-person visit dates',
            'Set up a simple way to share training materials with champions (video recordings, screenshots, written guides)',
            'Track which features each champion has been trained on so nothing falls through the cracks',
            'After each in-person session, capture feedback on what the team is struggling with to feed back into the next build cycle',
        ],
        champions: ['Andrew (FA)', 'Tori (Tax)', 'James (Accounting)', 'Netasha (Insurance)'],
        successMetric:
            'Every new feature that ships has at least one trained champion per relevant department before it goes live. Champions are confident enough to train their own teams without riivo present.',
    },
];
