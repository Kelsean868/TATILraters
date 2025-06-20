// This file contains the rate data for the Property Insurance Rater.
// By separating this data, we can easily update rates without changing the main rater logic.

const PROPERTY_RATES = {
    homeowners: {
        building: {
            group: 3.50,    // Rate per $1000 of value
            individual: 3.75 // Rate per $1000 of value
        },
        contents: 4.00      // Rate per $1000 of value
    },
    commercial: {
        fire: 3.50          // Rate per $1000 of value
    },
    tax: {
        ipt: 0.06 // 6% Insurance Premium Tax
    }
};
