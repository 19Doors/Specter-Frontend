// Enums for categorical fields
export enum RiskLevel {
    STANDARD = "standard",
    MEDIUM = "medium",
    HIGH = "high",
}

export enum Importance {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
}

export enum Severity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
}

export enum HighlightType {
    POSITIVE = "positive",
    WARNING = "warning",
    NEUTRAL = "neutral",
}

export enum ObligationCategory {
    FINANCIAL = "financial",
    ACCESS = "access",
    MAINTENANCE = "maintenance",
    LEGAL = "legal",
    OTHER = "other",
}

// Core citation interface with filename, bounding box, and text
export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface SourceCitation {
    filename: string;
    bounding_box: BoundingBox;
    paragraph_text: string;
    page_number: number;
    paragraph_id: string;
}

export interface PrimaryParty {
    role: string;
    name: string;
    source_citation: SourceCitation;
}

export interface DocumentOverview {
    title: string;
    primary_parties: PrimaryParty[];
    document_type: string;
    effective_period: string;
    total_pages: number;
}

export interface FinancialTerm {
    term: string;
    amount: string;
    description: string;
    source_citation: SourceCitation;
    risk_level: RiskLevel;
}

export interface ImportantDate {
    event: string;
    date: string;
    description: string;
    source_citation: SourceCitation;
    importance: Importance;
}

export interface RiskItem {
    title: string;
    description: string;
    why_risky: string;
    recommendation: string;
    source_citation: SourceCitation;
    severity: Severity;
}

export interface RiskAssessment {
    overall_risk_score: number;
    risk_summary: string;
    high_risk_items: RiskItem[];
    medium_risk_items: RiskItem[];
    low_risk_items?: RiskItem[];
}

export interface Obligation {
    party: string;
    obligation: string;
    consequence: string;
    source_citation: SourceCitation;
    category: ObligationCategory;
}

export interface SummaryHighlight {
    type: HighlightType;
    text: string;
    source_citation: SourceCitation;
}

export interface LegalDocumentSummary {
    document_overview: DocumentOverview;
    key_financial_terms: FinancialTerm[];
    important_dates: ImportantDate[];
    risk_assessment: RiskAssessment;
    key_obligations: Obligation[];
    summary_highlights: SummaryHighlight[];
}
