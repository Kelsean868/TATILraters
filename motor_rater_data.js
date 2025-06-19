// This file contains the rate data for the Motor Insurance Rater.
// Separating this data improves performance on slow connections.

const NCD_RATES = {
    private: { 
        comprehensive: [0, 0.25, 0.35, 0.45, 0.60], 
        'third-party': [0, 0.15, 0.20, 0.25, 0.35] 
    },
    platinum: { 
        comprehensive: [0, 0.25, 0.35, 0.45, 0.60] 
    },
    commercial: { 
        comprehensive: [0, 0.15, 0.20, 0.25, 0.35], 
        'third-party': [0, 0.15, 0.20, 0.25, 0.35] 
    }
};

const SPECIAL_DISCOUNTS = { 
    'CSR / Agent': 'csr', 
    'Underwriter': 'underwriter', 
    'Manager Special': 'manager', 
    'Fleet Discount': 'fleet' 
};
