def get_cert_bodies(country: str) -> list[str]:
    """Return cert bodies for a country, always as a list."""
    val = halal_dict.get(country)
    if val is None:
        return []
    return val if isinstance(val, list) else [val]


halal_dict = {
    'Malaysia': 'JAKIM',
    'Indonesia': ['BPJPH', 'MUI', 'MUI - Halal'],
    'Singapore': 'MUIS',
    'Thailand': ['CICOT', 'HALAL CICOT', 'Halal Science Center - Chulalongkorn'],
    'Philippines': 'Philippine Halal Export Development and Promotion Board',
    'Pakistan': ['Halal Pakistan', 'Pakistan Halal Authority'],
    'India': ['Jamiat Ulama-i-Hind Halal Trust', 'Halal India Pvt. Ltd.', 'Halal Certification Services India Pvt. Ltd.'],
    'Sri Lanka': 'ACJU-HAC',
    'UAE': ['ESMA', 'EIAC'],
    'Saudi Arabia': 'SASO',
    'Qatar': 'Qatar Halal Center',
    'GCC-wide': 'GAC',
    'Bahrain': 'BSMD',
    'Kuwait': 'Kuwait Municipality – Halal Department',
    'South Africa': ['SANHA', 'NIHT'],
    'Zimbabwe': 'Halal Food Authority of Zimbabwe',
    'Kenya': 'KBHC',
    'Tanzania': 'Halal Tanzania',
    'Uganda': 'UMSC',
    'Belgium': 'HFCE',
    'UK': 'HFA',
    'Netherlands, Germany, Italy, UK': 'HQC',
    'France': 'AVS Halal Certification',
    'Switzerland': 'HCS',
    'Germany': 'Halal Control GmbH',
    'Kazakhstan': ['Halal Damu', 'SAMK'],
    'Uzbekistan': 'Halal Committee – Uzbekistan Religious Affairs',
    'Japan': 'JIT',
    'South Korea': 'Korea Muslim Federation',
    'Taiwan': 'THIDA',
    'China': 'China Islamic Association (CIA)',
    'USA': ['IFANCA', 'HFSAA', 'ISWA Halal Certification Department', 'MCG'],
    'Canada': 'HMA',
    'Australia': ['AFIC Halal Authority', 'Halal Australia'],
    'New Zealand': ['FIANZ', 'NZIDT'],
    'Bosnia and Herzegovina': 'Agency for Halal Quality Certification (B&H)',
    'Croatia': 'Halal Quality Certification',
    'European Muslim League': 'ERHC',
    'Global': 'IAFIA',
    'OIC': 'SMIIC',
}