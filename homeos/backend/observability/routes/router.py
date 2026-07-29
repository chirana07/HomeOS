import io
from typing import Optional
from fastapi import APIRouter
from fastapi.responses import StreamingResponse, Response
from observability.database.repository import ObservabilityRepository
from observability.report_generator import report_generator

router = APIRouter()

@router.get("/summary")
def get_executive_summary():
    """
    Returns executive metrics summary for Tab 1 of the dashboard.
    """
    return ObservabilityRepository.get_executive_summary()

@router.get("/engineering")
def get_engineering_metrics():
    """
    Returns engineering metrics (latencies, retries, trace links) for Tab 2.
    """
    return ObservabilityRepository.get_engineering_metrics()

@router.get("/finops")
def get_finops_metrics():
    """
    Returns FinOps cost metrics and unit economics for Tab 3.
    """
    return ObservabilityRepository.get_finops_metrics()

@router.get("/governance")
def get_governance_metrics():
    """
    Returns AI Governance, lineage, and evaluation metrics for Tab 4.
    """
    return ObservabilityRepository.get_governance_metrics()

@router.get("/cost-report")
@router.get("/cost-report/{run_id}")
def get_cost_report(run_id: str = None):
    """
    Returns the Production-Grade AI Cost Estimation Report (JSON & ASCII format).
    """
    report_data = report_generator.get_workflow_cost_report(run_id)
    ascii_text = report_generator.generate_ascii_report(report_data)
    return {
        "report_data": report_data,
        "ascii_report": ascii_text
    }

@router.get("/cost-report-pdf")
@router.get("/cost-report/{run_id}/pdf")
def download_cost_report_pdf(run_id: str = None):
    """
    Exports a professional PDF Cost Estimation Report binary stream.
    """
    report_data = report_generator.get_workflow_cost_report(run_id)
    pdf_bytes = report_generator.generate_pdf_report(report_data)
    
    filename = f"HomeOS_AI_Cost_Report_{report_data.get('run_id', 'latest')}.pdf"
    
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )
