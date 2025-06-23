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

// NEW: Centralized rates for optional benefits
const OPTIONAL_BENEFITS = {
    windscreen: {
        comprehensive: {
            free_limit: 5000,
            rate: 0.10
        },
        third_party: {
            max_value: 7000,
            rate: 0.10
        }
    },
    personal_accident: {
        comprehensive: 200,
        third_party: 100
    },
    loss_of_use: 400,
    increased_tpl: 2500 // Platinum Drive only
};
