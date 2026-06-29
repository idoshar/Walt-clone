const rawRestaurantCatalog = [
    {
        id: '1',
        name: 'Pizza Roma',
        address: 'Herzl 10, Tel Aviv',
        phone: '03-1111111',
        cuisine: 'Italian',
        description:
            'Roman-style pizza, fresh pasta and classic Italian desserts.',
        image:
            'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=900&q=80',
        latitude: 32.0616,
        longitude: 34.7743,
        categories: [
            {
                id: 'pizza-roma-pizza',
                name: 'Pizza',
                menuType: 'main',
                sortOrder: 10
            },
            {
                id: 'pizza-roma-pasta',
                name: 'Pasta',
                menuType: 'main',
                sortOrder: 20
            },
            {
                id: 'pizza-roma-desserts',
                name: 'Desserts',
                menuType: 'dessert',
                sortOrder: 30
            }
        ],
        products: [
            {
                id: 'pizza-margherita',
                name: 'Margherita Pizza',
                price: 52,
                description:
                    'Tomato sauce, mozzarella, basil and olive oil.',
                categoryId: 'pizza-roma-pizza'
            },
            {
                id: 'truffle-mushroom-pizza',
                name: 'Truffle Mushroom Pizza',
                price: 64,
                description:
                    'Mozzarella, roasted mushrooms, truffle cream and parmesan.',
                categoryId: 'pizza-roma-pizza'
            },
            {
                id: 'pasta-alfredo',
                name: 'Pasta Alfredo',
                price: 48,
                description:
                    'Fresh pasta in a creamy parmesan sauce.',
                categoryId: 'pizza-roma-pasta'
            },
            {
                id: 'spicy-arrabbiata-pasta',
                name: 'Spicy Arrabbiata Pasta',
                price: 50,
                description:
                    'Penne, tomato sauce, chili, garlic and parsley.',
                categoryId: 'pizza-roma-pasta'
            },
            {
                id: 'tiramisu',
                name: 'Classic Tiramisu',
                price: 32,
                description:
                    'Coffee-soaked ladyfingers with mascarpone cream.',
                categoryId: 'pizza-roma-desserts'
            },
            {
                id: 'pistachio-panna-cotta',
                name: 'Pistachio Panna Cotta',
                price: 34,
                description:
                    'Vanilla cream with pistachio crumble and berry sauce.',
                categoryId: 'pizza-roma-desserts'
            }
        ]
    },
    {
        id: '2',
        name: 'Burger House',
        address: 'Dizengoff 50, Tel Aviv',
        phone: '03-2222222',
        cuisine: 'American',
        description:
            'Smash burgers, crispy sides and cold drinks made for delivery.',
        image:
            'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&q=80',
        latitude: 32.077,
        longitude: 34.774,
        categories: [
            {
                id: 'burger-house-burgers',
                name: 'Burgers',
                menuType: 'main',
                sortOrder: 10
            },
            {
                id: 'burger-house-sides',
                name: 'Sides',
                menuType: 'side',
                sortOrder: 20
            },
            {
                id: 'burger-house-drinks',
                name: 'Drinks',
                menuType: 'drink',
                sortOrder: 30
            }
        ],
        products: [
            {
                id: 'classic-burger',
                name: 'Classic Beef Burger',
                price: 58,
                description:
                    'Grilled beef patty, lettuce, tomato and house sauce.',
                categoryId: 'burger-house-burgers'
            },
            {
                id: 'chicken-burger',
                name: 'Crispy Chicken Burger',
                price: 55,
                description:
                    'Crispy chicken, coleslaw, pickles and spicy mayo.',
                categoryId: 'burger-house-burgers'
            },
            {
                id: 'crispy-fries',
                name: 'Crispy Fries',
                price: 18,
                description:
                    'Golden fries served with ketchup.',
                categoryId: 'burger-house-sides'
            },
            {
                id: 'onion-rings',
                name: 'Onion Rings',
                price: 21,
                description:
                    'Crispy battered onion rings with barbecue dip.',
                categoryId: 'burger-house-sides'
            },
            {
                id: 'house-lemonade',
                name: 'House Lemonade',
                price: 14,
                description:
                    'Fresh lemon juice, mint and sparkling water.',
                categoryId: 'burger-house-drinks'
            },
            {
                id: 'sparkling-water',
                name: 'Sparkling Water',
                price: 10,
                description:
                    'Chilled sparkling mineral water.',
                categoryId: 'burger-house-drinks'
            }
        ]
    },
    {
        id: '3',
        name: 'Sushi Bar',
        address: 'Rothschild 22, Tel Aviv',
        phone: '03-3333333',
        cuisine: 'Japanese',
        description:
            'Fresh sushi rolls, colourful bowls and Japanese small plates.',
        image:
            'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=900&q=80',
        latitude: 32.0627,
        longitude: 34.7726,
        categories: [
            {
                id: 'sushi-bar-rolls',
                name: 'Sushi Rolls',
                menuType: 'main',
                sortOrder: 10
            },
            {
                id: 'sushi-bar-bowls',
                name: 'Bowls',
                menuType: 'main',
                sortOrder: 20
            },
            {
                id: 'sushi-bar-sides',
                name: 'Sides',
                menuType: 'side',
                sortOrder: 30
            }
        ],
        products: [
            {
                id: 'salmon-avocado-roll',
                name: 'Salmon Avocado Roll',
                price: 46,
                description:
                    'Fresh salmon, avocado and sushi rice.',
                categoryId: 'sushi-bar-rolls'
            },
            {
                id: 'spicy-tuna-roll',
                name: 'Spicy Tuna Roll',
                price: 49,
                description:
                    'Tuna, cucumber, sesame and spicy sauce.',
                categoryId: 'sushi-bar-rolls'
            },
            {
                id: 'salmon-poke-bowl',
                name: 'Salmon Poke Bowl',
                price: 58,
                description:
                    'Salmon, rice, avocado, edamame and ponzu sauce.',
                categoryId: 'sushi-bar-bowls'
            },
            {
                id: 'tofu-sesame-bowl',
                name: 'Tofu Sesame Bowl',
                price: 52,
                description:
                    'Crispy tofu, vegetables, rice and sesame dressing.',
                categoryId: 'sushi-bar-bowls'
            },
            {
                id: 'edamame',
                name: 'Edamame',
                price: 16,
                description:
                    'Steamed soybeans with sea salt.',
                categoryId: 'sushi-bar-sides'
            },
            {
                id: 'miso-soup',
                name: 'Miso Soup',
                price: 12,
                description:
                    'Traditional miso broth with tofu and seaweed.',
                categoryId: 'sushi-bar-sides'
            }
        ]
    },
    {
        id: '4',
        name: 'Levant Kitchen',
        address: 'Ibn Gabirol 89, Tel Aviv',
        phone: '03-4444444',
        cuisine: 'Middle Eastern',
        description:
            'Modern Levantine comfort food with pitas, plates and desserts.',
        image:
            'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&q=80',
        latitude: 32.0832,
        longitude: 34.7818,
        categories: [
            {
                id: 'levant-kitchen-pitas',
                name: 'Pitas',
                menuType: 'main',
                sortOrder: 10
            },
            {
                id: 'levant-kitchen-plates',
                name: 'Plates',
                menuType: 'main',
                sortOrder: 20
            },
            {
                id: 'levant-kitchen-desserts',
                name: 'Desserts',
                menuType: 'dessert',
                sortOrder: 30
            }
        ],
        products: [
            {
                id: 'chicken-shawarma-pita',
                name: 'Chicken Shawarma Pita',
                price: 48,
                description:
                    'Spiced chicken, tahini, pickles and fresh herbs.',
                categoryId: 'levant-kitchen-pitas'
            },
            {
                id: 'halloumi-pita',
                name: 'Grilled Halloumi Pita',
                price: 45,
                description:
                    'Halloumi, tomato salsa, arugula and lemon aioli.',
                categoryId: 'levant-kitchen-pitas'
            },
            {
                id: 'kofta-tahini-plate',
                name: 'Kofta Tahini Plate',
                price: 64,
                description:
                    'Grilled kofta, rice, tahini and seasonal salad.',
                categoryId: 'levant-kitchen-plates'
            },
            {
                id: 'roasted-cauliflower-plate',
                name: 'Roasted Cauliflower Plate',
                price: 48,
                description:
                    'Roasted cauliflower, tahini, herbs and toasted almonds.',
                categoryId: 'levant-kitchen-plates'
            },
            {
                id: 'malabi',
                name: 'Rosewater Malabi',
                price: 18,
                description:
                    'Creamy milk pudding with coconut and pistachios.',
                categoryId: 'levant-kitchen-desserts'
            },
            {
                id: 'knafeh',
                name: 'Warm Knafeh',
                price: 26,
                description:
                    'Sweet cheese pastry with syrup and pistachios.',
                categoryId: 'levant-kitchen-desserts'
            }
        ]
    },
    {
        id: '5',
        name: 'Green Bowl',
        address: 'King George 18, Tel Aviv',
        phone: '03-5555555',
        cuisine: 'Healthy',
        description:
            'Fresh bowls, colourful salads and made-to-order smoothies.',
        image:
            'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900&q=80',
        latitude: 32.0714,
        longitude: 34.7796,
        categories: [
            {
                id: 'green-bowl-bowls',
                name: 'Bowls',
                menuType: 'main',
                sortOrder: 10
            },
            {
                id: 'green-bowl-salads',
                name: 'Salads',
                menuType: 'main',
                sortOrder: 20
            },
            {
                id: 'green-bowl-smoothies',
                name: 'Smoothies',
                menuType: 'drink',
                sortOrder: 30
            }
        ],
        products: [
            {
                id: 'green-tahini-bowl',
                name: 'Green Tahini Bowl',
                price: 53,
                description:
                    'Quinoa, roasted vegetables, chickpeas and tahini.',
                categoryId: 'green-bowl-bowls'
            },
            {
                id: 'tofu-protein-bowl',
                name: 'Tofu Protein Bowl',
                price: 55,
                description:
                    'Crispy tofu, brown rice, greens and sesame dressing.',
                categoryId: 'green-bowl-bowls'
            },
            {
                id: 'crunchy-kale-salad',
                name: 'Crunchy Kale Salad',
                price: 44,
                description:
                    'Kale, apple, almonds, cabbage and lemon vinaigrette.',
                categoryId: 'green-bowl-salads'
            },
            {
                id: 'halloumi-salad',
                name: 'Grilled Halloumi Salad',
                price: 49,
                description:
                    'Halloumi, greens, cherry tomatoes and balsamic glaze.',
                categoryId: 'green-bowl-salads'
            },
            {
                id: 'mango-turmeric-smoothie',
                name: 'Mango Turmeric Smoothie',
                price: 22,
                description:
                    'Mango, banana, turmeric and oat milk.',
                categoryId: 'green-bowl-smoothies'
            },
            {
                id: 'berry-yogurt-smoothie',
                name: 'Berry Yogurt Smoothie',
                price: 23,
                description:
                    'Mixed berries, yogurt, banana and honey.',
                categoryId: 'green-bowl-smoothies'
            }
        ]
    },
    {
        id: '6',
        name: 'Bombay Spice',
        address: 'Nahalat Binyamin 22, Tel Aviv',
        phone: '03-6666666',
        cuisine: 'Indian',
        description:
            'Indian curries, tandoor dishes and fragrant sides.',
        image:
            'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=900&q=80',
        latitude: 32.0668,
        longitude: 34.7711,
        categories: [
            {
                id: 'bombay-spice-curries',
                name: 'Curries',
                menuType: 'main',
                sortOrder: 10
            },
            {
                id: 'bombay-spice-tandoor',
                name: 'Tandoor',
                menuType: 'main',
                sortOrder: 20
            },
            {
                id: 'bombay-spice-sides',
                name: 'Sides',
                menuType: 'side',
                sortOrder: 30
            }
        ],
        products: [
            {
                id: 'butter-chicken',
                name: 'Butter Chicken',
                price: 64,
                description:
                    'Tender chicken in a rich tomato, butter and cashew sauce.',
                categoryId: 'bombay-spice-curries'
            },
            {
                id: 'chickpea-masala',
                name: 'Chickpea Masala',
                price: 48,
                description:
                    'Chickpeas simmered with tomato, ginger and warm spices.',
                categoryId: 'bombay-spice-curries'
            },
            {
                id: 'chicken-tikka',
                name: 'Chicken Tikka',
                price: 58,
                description:
                    'Yogurt-marinated chicken grilled in the tandoor.',
                categoryId: 'bombay-spice-tandoor'
            },
            {
                id: 'tandoori-cauliflower',
                name: 'Tandoori Cauliflower',
                price: 42,
                description:
                    'Charred cauliflower with tandoori spices and yogurt.',
                categoryId: 'bombay-spice-tandoor'
            },
            {
                id: 'basmati-rice',
                name: 'Basmati Rice',
                price: 12,
                description:
                    'Fragrant steamed basmati rice.',
                categoryId: 'bombay-spice-sides'
            },
            {
                id: 'cucumber-raita',
                name: 'Cucumber Raita',
                price: 14,
                description:
                    'Cooling yogurt, cucumber and mint dip.',
                categoryId: 'bombay-spice-sides'
            }
        ]
    }
];

const catalogRestaurants = rawRestaurantCatalog.map(
    ({ categories, products, ...restaurant }) => ({
        ...restaurant,
        isDefault: true
    })
);

const catalogMenuCategories = rawRestaurantCatalog.flatMap(
    ({ id: restaurantId, categories }) =>
        categories.map((category) => ({
            ...category,
            restaurantId,
            normalizedName: category.name.toLowerCase()
        }))
);

const categoryNameByKey = new Map(
    catalogMenuCategories.map((category) => [
        `${category.restaurantId}:${category.id}`,
        category.name
    ])
);

const catalogProducts = rawRestaurantCatalog.flatMap(
    ({ id: restaurantId, products }) =>
        products.map((product) => {
            const category = categoryNameByKey.get(
                `${restaurantId}:${product.categoryId}`
            );

            if (!category) {
                throw new Error(
                    `Catalog product ${product.id} references an unknown category`
                );
            }

            return {
                ...product,
                restaurantId,
                category,
                image: ''
            };
        })
);

module.exports = {
    catalogRestaurants,
    catalogMenuCategories,
    catalogProducts
};
