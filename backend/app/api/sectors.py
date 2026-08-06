from fastapi import APIRouter
from typing import List, Dict
from pydantic import BaseModel

router = APIRouter()

class StockSummary(BaseModel):
    symbol: str
    company_name: str
    category: str
    description_layman: str

@router.get("/sectors", response_model=Dict[str, List[StockSummary]])
async def get_grouped_sectors():
    """
    Returns companies grouped by their layman category for the frontend navigation bar.
    """
    return {
        "Mega-Cap Tech": [
            {"symbol": "AAPL", "company_name": "Apple Inc.", "category": "Mega-Cap Tech", "description_layman": "Maker of iPhones and Mac computers."},
            {"symbol": "MSFT", "company_name": "Microsoft Corp.", "category": "Mega-Cap Tech", "description_layman": "Cloud computing and Windows software giant."},
            {"symbol": "GOOGL", "company_name": "Alphabet Inc.", "category": "Mega-Cap Tech", "description_layman": "Google search and advertising monopoly."},
            {"symbol": "AMZN", "company_name": "Amazon.com Inc.", "category": "Mega-Cap Tech", "description_layman": "E-commerce and cloud infrastructure leader."}
        ],
        "AI & Semiconductors": [
            {"symbol": "NVDA", "company_name": "NVIDIA Corp.", "category": "AI & Semiconductors", "description_layman": "Builds the microchips that power modern AI."},
            {"symbol": "AMD", "company_name": "Advanced Micro Devices", "category": "AI & Semiconductors", "description_layman": "Produces high-performance computer processors."},
            {"symbol": "TSM", "company_name": "Taiwan Semiconductor", "category": "AI & Semiconductors", "description_layman": "World's largest dedicated independent semiconductor foundry."}
        ],
        "EVs & Mobility": [
            {"symbol": "TSLA", "company_name": "Tesla Inc.", "category": "EVs & Mobility", "description_layman": "Electric cars, battery storage, and robotics."},
            {"symbol": "RIVN", "company_name": "Rivian Automotive", "category": "EVs & Mobility", "description_layman": "Electric trucks and delivery vans."}
        ],
        "Banking & Wall St": [
            {"symbol": "JPM", "company_name": "JPMorgan Chase & Co.", "category": "Banking & Wall Street", "description_layman": "Largest banking and financial institution in the US."},
            {"symbol": "BAC", "company_name": "Bank of America", "category": "Banking & Wall Street", "description_layman": "Multinational banking and financial services."}
        ]
    }
