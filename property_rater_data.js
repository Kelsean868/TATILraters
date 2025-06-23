// This file contains the rate data for the Property Insurance Rater.
// By separating this data, we can easily update rates without changing the main rater logic.

const PROPERTY_RATES = {
    homeowners: {
        building: {
            group: 3.50,        // Rate per $1000 of value
            individual: 3.75,   // Rate per $1000 of value
            flood_prone: 5.00   // Increased rate per $1000 for flood-prone areas
        },
        contents: {
            general: 4.00,          // Rate per $1000 of value
            electronics: 0.01,      // 1% of value
            jewelry: {
                on_premises: 0.015,     // 1.5% of value
                trinidad_tobago: 0.02,  // 2% of value
                worldwide: 0.025        // 2.5% of value
            },
            special_items: 0.01,    // 1% of value
            all_risk: 0.03          // 3% of total contents value
        },
        excess: {
            standard_flood: 2500,
            increased_flood: 5000
        }
    },
    commercial: {
        fire: 3.50          // Rate per $1000 of value
    },
    tax: {
        ipt: 0.06 // 6% Insurance Premium Tax
    }
};
