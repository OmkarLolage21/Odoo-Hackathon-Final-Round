from fastapi import APIRouter, Depends, Header, HTTPException, status
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from core.deps import get_current_user
from core.database import get_session
from models.user_models import User, UserRole
from schemas.schemas import DashboardResponse, DashboardMonthlyItem


router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


async def verify_user_role(
    current_user: User = Depends(get_current_user),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
) -> User:
    if not x_user_role:
        raise HTTPException(status_code=400, detail="X-User-Role header is required")
    try:
        role_enum = UserRole(x_user_role.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid role specified")
    if current_user.role != role_enum:
        raise HTTPException(status_code=403, detail="Role in header does not match user's role")
    return current_user


@router.get("/", response_model=DashboardResponse)
async def get_dashboard(
    current_user: User = Depends(verify_user_role),
    session: AsyncSession = Depends(get_session),
):
    # Only admin and invoicing_user can access
    if current_user.role not in [UserRole.ADMIN, UserRole.INVOICING_USER]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")

    # Totals
    total_revenue = 0.0
    total_expenses = 0.0
    total_items_in_stock = 0

    # Use SQL as we don't have a Payments ORM model defined
    # Sum of receive amounts
    revenue_sql = text(
        """
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM payments
        WHERE payment_direction = 'receive'
        """
    )
    # Sum of send amounts
    expenses_sql = text(
        """
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM payments
        WHERE payment_direction = 'send'
        """
    )
    # Total stock items as sum of current_stock across products
    stock_sql = text(
        """
        SELECT COALESCE(SUM(current_stock), 0) AS total
        FROM products
        """
    )

    res_rev = await session.execute(revenue_sql)
    total_revenue = float(res_rev.scalar() or 0)

    res_exp = await session.execute(expenses_sql)
    total_expenses = float(res_exp.scalar() or 0)

    res_stock = await session.execute(stock_sql)
    total_items_in_stock = int(res_stock.scalar() or 0)

    # Sales vs Purchases by month (based on payments.payment_date month)
    # We format month as YYYY-MM
    monthly_sql = text(
        """
        WITH months AS (
            SELECT to_char(payment_date, 'YYYY-MM') AS ym,
                   payment_direction,
                   SUM(amount) AS total
            FROM payments
            GROUP BY 1, 2
        )
        SELECT ym,
               COALESCE(SUM(CASE WHEN payment_direction = 'receive' THEN total END), 0) AS sales,
               COALESCE(SUM(CASE WHEN payment_direction = 'send' THEN total END), 0) AS purchases
        FROM months
        GROUP BY ym
        ORDER BY ym
        """
    )

    res_monthly = await session.execute(monthly_sql)
    sales_vs_purchases: list[DashboardMonthlyItem] = []
    for row in res_monthly.mappings():
        sales_vs_purchases.append(
            DashboardMonthlyItem(
                month=row["ym"],
                sales=float(row["sales"] or 0),
                purchases=float(row["purchases"] or 0),
            )
        )

    return DashboardResponse(
        total_revenue=total_revenue,
        total_expenses=total_expenses,
        net_profit=float(total_revenue - total_expenses),
        total_items_in_stock=total_items_in_stock,
        sales_vs_purchases=sales_vs_purchases,
    )
