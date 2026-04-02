"""Exchange rates and currency conversion — ported from frontend countries.ts"""

EXCHANGE_RATES = {
    "USD": 1.0, "EUR": 1.09, "GBP": 1.27, "JPY": 0.0067, "CAD": 0.74,
    "AUD": 0.65, "CHF": 1.12, "CNY": 0.138, "INR": 0.012, "MXN": 0.058,
    "BRL": 0.2, "KRW": 0.00074, "SGD": 0.74, "HKD": 0.128, "NOK": 0.095,
    "SEK": 0.096, "DKK": 0.146, "NZD": 0.61, "ZAR": 0.054, "AED": 0.272,
    "SAR": 0.266, "QAR": 0.274, "KWD": 3.26, "BHD": 2.65, "OMR": 2.6,
    "PKR": 0.0036, "BDT": 0.0091, "IDR": 0.000063, "MYR": 0.224,
    "PHP": 0.018, "THB": 0.028, "VND": 0.000039, "EGP": 0.032,
    "NGN": 0.00066, "KES": 0.0077, "GHS": 0.068, "TZS": 0.00039,
    "UGX": 0.00027, "ETB": 0.0177, "MAD": 0.099, "TND": 0.32,
    "RUB": 0.011, "TRY": 0.031, "PLN": 0.25, "CZK": 0.044,
    "HUF": 0.0028, "RON": 0.22, "UAH": 0.024, "ILS": 0.27,
    "CLP": 0.0011, "COP": 0.00024, "PEN": 0.27, "ARS": 0.001,
}


def convert_currency(amount, from_currency, to_currency):
    from_rate = EXCHANGE_RATES.get(from_currency, 1.0)
    to_rate = EXCHANGE_RATES.get(to_currency, 1.0)
    return amount * (from_rate / to_rate)
