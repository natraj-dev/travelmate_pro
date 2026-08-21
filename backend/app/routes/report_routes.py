"""Exportable reports for bookings, revenue, and operations."""
from datetime import datetime
from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_admin
from app.models.user import User
from app.models.business import Report
from app.models.hotel import HotelBooking, Hotel
from app.models.tour import TourBooking, TourPackage
from app.models.payment import Payment
from app.models.enums import PaymentStatus
from app.schemas.business import ReportGenerateRequest, ReportOut
from app.services.export_service import export_pdf, export_csv, export_excel
from app.utils.exceptions import bad_request, not_found

router = APIRouter(prefix="/reports", tags=["Reports & Export"])


def _build_dataset(db: Session, report_type: str, date_from, date_to):
    if report_type == "BOOKING":
        headers = ["Reference", "Type", "Customer ID", "Amount", "Status", "Created"]
        rows = []
        hb_query = db.query(HotelBooking)
        tb_query = db.query(TourBooking)
        if date_from:
            hb_query = hb_query.filter(HotelBooking.created_at >= date_from)
            tb_query = tb_query.filter(TourBooking.created_at >= date_from)
        if date_to:
            hb_query = hb_query.filter(HotelBooking.created_at <= date_to)
            tb_query = tb_query.filter(TourBooking.created_at <= date_to)
        for b in hb_query.all():
            rows.append([b.booking_reference, "Hotel", b.customer_id, b.total_amount, b.status.value, b.created_at.strftime("%Y-%m-%d")])
        for b in tb_query.all():
            rows.append([b.booking_reference, "Tour", b.customer_id, b.total_amount, b.status.value, b.created_at.strftime("%Y-%m-%d")])
        return headers, rows

    if report_type == "REVENUE":
        headers = ["Payment ID", "Customer ID", "Amount", "Currency", "Status", "Paid At"]
        query = db.query(Payment).filter(Payment.status == PaymentStatus.SUCCEEDED)
        if date_from:
            query = query.filter(Payment.paid_at >= date_from)
        if date_to:
            query = query.filter(Payment.paid_at <= date_to)
        rows = [[p.id, p.customer_id, p.amount, p.currency.upper(), p.status.value,
                 p.paid_at.strftime("%Y-%m-%d") if p.paid_at else "-"] for p in query.all()]
        return headers, rows

    if report_type == "HOTEL":
        headers = ["Hotel", "City", "Star Rating", "Rating Avg", "Total Bookings"]
        rows = [[h.name, h.city, h.star_rating, h.rating_avg, len(h.bookings)] for h in db.query(Hotel).all()]
        return headers, rows

    if report_type == "TOUR":
        headers = ["Package", "Operator ID", "Price/Person", "Rating Avg", "Total Bookings"]
        rows = [[p.title, p.operator_id, p.price_per_person, p.rating_avg, len(p.bookings)] for p in db.query(TourPackage).all()]
        return headers, rows

    if report_type == "CUSTOMER":
        from app.models.enums import UserRole
        headers = ["Customer ID", "Name", "Email", "Joined"]
        rows = [[u.id, u.full_name(), u.email, u.created_at.strftime("%Y-%m-%d")]
                for u in db.query(User).filter(User.role == UserRole.CUSTOMER).all()]
        return headers, rows

    if report_type == "AGENT":
        from app.models.business import TravelAgentProfile
        headers = ["Agent ID", "Agency", "Commission Rate %", "Verification"]
        rows = [[a.id, a.agency_name or "-", a.commission_rate_percent, a.verification_status.value]
                for a in db.query(TravelAgentProfile).all()]
        return headers, rows

    raise bad_request("Unsupported report_type")


@router.post("/generate", response_model=ReportOut)
def generate_report(payload: ReportGenerateRequest, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    headers, rows = _build_dataset(db, payload.report_type.upper(), payload.date_from, payload.date_to)

    fmt = payload.format.upper()
    if fmt == "PDF":
        path = export_pdf(payload.report_type.title(), headers, rows)
    elif fmt == "CSV":
        path = export_csv(payload.report_type.title(), headers, rows)
    elif fmt == "EXCEL":
        path = export_excel(payload.report_type.title(), headers, rows)
    else:
        raise bad_request("format must be PDF, CSV, or EXCEL")

    report = Report(generated_by_id=current_user.id, report_type=payload.report_type.upper(), format=fmt, file_path=path)
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/{report_id}/download")
def download_report(report_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    report = db.get(Report, report_id)
    if not report:
        raise not_found("Report")
    media_types = {"PDF": "application/pdf", "CSV": "text/csv",
                   "EXCEL": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}
    filename = report.file_path.split("/")[-1]
    return FileResponse(report.file_path, filename=filename, media_type=media_types.get(report.format, "application/octet-stream"))


@router.get("", response_model=list[ReportOut])
def list_reports(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return db.query(Report).order_by(Report.created_at.desc()).limit(50).all()
