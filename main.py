from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from exceptions import (
    InvalidPincodeError,
    PincodeNotFoundError,
    invalid_pincode_exception_handler,
    pincode_not_found_exception_handler,
)
from models import BulkLocationRequest, BulkLocationResponse, LocationResponse
from data import pincode_db

app = FastAPI(
    title="Tanzania Pincodes Lookup API",
    description="Autofill Tanzanian regions, cities, and districts from a 6-digit postal code during checkout and delivery verification.",
    version="1.0.0",
)

# Enable CORS for web frontends, localhost, and external integrations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom exception handlers
app.add_exception_handler(PincodeNotFoundError, pincode_not_found_exception_handler)
app.add_exception_handler(InvalidPincodeError, invalid_pincode_exception_handler)

# Path to frontend directory
FRONTEND_DIR = Path(__file__).resolve().parent / "frontend"

if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

    @app.get("/", include_in_schema=False)
    def serve_frontend():
        return FileResponse(FRONTEND_DIR / "index.html")

    @app.get("/styles.css", include_in_schema=False)
    def serve_css():
        return FileResponse(FRONTEND_DIR / "styles.css", media_type="text/css")

    @app.get("/app.js", include_in_schema=False)
    def serve_js():
        return FileResponse(FRONTEND_DIR / "app.js", media_type="application/javascript")


@app.get("/api", tags=["General"])
def api_root():
    return {
        "message": "Welcome to the Tanzania Pincode Lookup API!",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "single_lookup": "GET /pincode/{code}",
            "bulk_lookup": "POST /pincodes",
            "all_pincodes": "GET /pincodes/all",
            "health": "GET /api/health",
        },
    }


@app.get("/api/health", tags=["General"])
def health_check():
    return {
        "status": "healthy",
        "total_pincodes": len(pincode_db),
        "regions_count": len({loc["region"] for loc in pincode_db.values()}),
    }


@app.get("/pincode/{code}", response_model=LocationResponse, tags=["Pincode Lookup"])
def get_location_by_pincode(code: str):
    """
    Look up a Tanzanian location using a 6-digit postal code.
    """
    if len(code) != 6 or not code.isdigit():
        raise InvalidPincodeError(code, reason="Must be exactly a 6-digit number.")

    if code not in pincode_db:
        raise PincodeNotFoundError(code)

    loc = pincode_db[code]
    return LocationResponse(
        pincode=code,
        region=loc["region"],
        city=loc["city"],
        district=loc["district"],
    )


@app.get("/pincodes/all", response_model=list[LocationResponse], tags=["Pincode Lookup"])
def get_all_pincodes():
    """
    Retrieve all registered postal codes with their regions, cities, and districts.
    """
    return [
        LocationResponse(
            pincode=code,
            region=loc["region"],
            city=loc["city"],
            district=loc["district"],
        )
        for code, loc in pincode_db.items()
    ]


@app.post("/pincodes", response_model=BulkLocationResponse, tags=["Pincode Lookup"])
def bulk_lookup_locations(request: BulkLocationRequest):
    """
    Look up multiple pincodes in a single batch request (up to 10 pincodes).
    """
    found_results = []
    missing_pincodes = []
    seen = set()

    for code in request.pincodes:
        if code in pincode_db:
            if code not in seen:
                loc = pincode_db[code]
                found_results.append(
                    LocationResponse(
                        pincode=code,
                        region=loc["region"],
                        city=loc["city"],
                        district=loc["district"],
                    )
                )
                seen.add(code)
        else:
            if code not in missing_pincodes:
                missing_pincodes.append(code)

    return BulkLocationResponse(
        found=len(found_results),
        not_found=len(missing_pincodes),
        results=found_results,
        missing=missing_pincodes,
    )


if __name__ == "__main__":
    import uvicorn

    print("🇹🇿 Starting Tanzania Pincodes Lookup Service...")
    print("📍 Frontend: http://127.0.0.1:8000")
    print("📚 API Docs: http://127.0.0.1:8000/docs")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
