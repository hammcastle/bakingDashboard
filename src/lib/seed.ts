import { addDaysKey, atTime, onWeekday, todayKey } from "./dates";
import { runTransaction, type SqlDatabase } from "./sqlite";
import type { Fulfillment, OrderStatus } from "./types";

type SeedOrder = {
  customer: string;
  due: string;
  status: OrderStatus;
  fulfillment: Fulfillment;
  price_cents: number | null;
  notes: string;
  items: { description: string; quantity: number }[];
};

export function seedDatabase(db: SqlDatabase): void {
  const today = todayKey();
  const tomorrow = addDaysKey(today, 1);
  const plus = (n: number) => addDaysKey(today, n);

  const customers = [
    {
      name: "Maya Chen",
      phone: "555-0142",
      email: "maya.chen@email.example",
      notes: "Gluten-free for Maya; her husband can eat wheat. Prefers morning pickup.",
    },
    {
      name: "Parker family",
      phone: "555-0198",
      email: "parkers@email.example",
      notes: "Leo's birthday is a standing chocolate cake. Allergies: none. Weekend pickups.",
    },
    {
      name: "River Cafe",
      phone: "555-0107",
      email: "orders@rivercafe.example",
      notes: "Wholesale. Deliver to the back door before 11. Invoice weekly.",
    },
    {
      name: "Elena Vasquez",
      phone: "555-0164",
      email: "elena.v@email.example",
      notes: "Standing Saturday sourdough. Likes extra dark crust.",
    },
    {
      name: "Tom Nguyen",
      phone: "555-0133",
      email: "tom.nguyen@email.example",
      notes: "Tree-nut allergy. Always label packages.",
    },
    {
      name: "Joshua Hamm",
      phone: "555-0121",
      email: "joshua@email.example",
      notes: "Family. Leave extra cookies if there are extras on the tray.",
    },
    {
      name: "Harbor School",
      phone: "555-0188",
      email: "kitchen@harborschool.example",
      notes: "Friday classroom bread. Nut-free kitchen that day. Deliver to the office by 8:30.",
    },
    {
      name: "Kim Alvarez",
      phone: "555-0175",
      email: "kim.alvarez@email.example",
      notes: "Event cakes. Wants a tasting if the order is over two tiers.",
    },
    {
      name: "Benito's Deli",
      phone: "555-0112",
      email: "benito@deli.example",
      notes: "Sandwich loaves. Back alley drop before 7. Slice if we have time.",
    },
  ];

  const insertCustomer = db.prepare(
    `INSERT INTO customers (name, phone, email, notes, created_at)
     VALUES (@name, @phone, @email, @notes, @created_at)`,
  );
  const createdAt = new Date().toISOString();
  const ids: Record<string, number> = {};
  for (const customer of customers) {
    const info = insertCustomer.run({ ...customer, created_at: createdAt });
    ids[customer.name] = Number(info.lastInsertRowid);
  }

  const orders: SeedOrder[] = [
    {
      customer: "Elena Vasquez",
      due: atTime(today, 8, 0),
      status: "baking",
      fulfillment: "pickup",
      price_cents: 1800,
      notes: "Two loaves, extra dark crust.",
      items: [{ description: "Sourdough loaf", quantity: 2 }],
    },
    {
      customer: "River Cafe",
      due: atTime(today, 10, 30),
      status: "confirmed",
      fulfillment: "delivery",
      price_cents: 5400,
      notes: "Back door. Muffin mix: blueberry and lemon poppy.",
      items: [
        { description: "Blueberry muffins", quantity: 24 },
        { description: "Lemon poppy muffins", quantity: 12 },
      ],
    },
    {
      customer: "Tom Nguyen",
      due: atTime(today, 16, 0),
      status: "ready",
      fulfillment: "pickup",
      price_cents: 2200,
      notes: "Nut-free kitchen batch. Label clearly.",
      items: [{ description: "Chocolate chip cookies (nut-free)", quantity: 12 }],
    },
    {
      customer: "Maya Chen",
      due: atTime(tomorrow, 9, 0),
      status: "confirmed",
      fulfillment: "pickup",
      price_cents: 2800,
      notes: "Gluten-free focaccia. Use GF flour mix, not wheat board.",
      items: [{ description: "Gluten-free focaccia", quantity: 1 }],
    },
    {
      customer: "Parker family",
      due: atTime(tomorrow, 14, 0),
      status: "confirmed",
      fulfillment: "pickup",
      price_cents: 6500,
      notes: "Leo turns 7. Chocolate cake, blue frosting, dinosaur topper if we have one.",
      items: [{ description: "6-inch chocolate birthday cake", quantity: 1 }],
    },
    {
      customer: "Joshua Hamm",
      due: atTime(tomorrow, 17, 30),
      status: "inquiry",
      fulfillment: "pickup",
      price_cents: null,
      notes: "Asked about leftover cookies. Confirm count tomorrow morning.",
      items: [{ description: "Assorted cookies", quantity: 18 }],
    },
    {
      customer: "River Cafe",
      due: atTime(plus(2), 10, 30),
      status: "confirmed",
      fulfillment: "delivery",
      price_cents: 4800,
      notes: "Regular weekday drop.",
      items: [{ description: "Croissants", quantity: 24 }],
    },
    {
      customer: "Elena Vasquez",
      due: atTime(plus(3), 9, 0),
      status: "inquiry",
      fulfillment: "pickup",
      price_cents: 1200,
      notes: "Might add a focaccia. Check Thursday.",
      items: [{ description: "Sourdough loaf", quantity: 1 }],
    },
    {
      customer: "Maya Chen",
      due: atTime(plus(4), 11, 0),
      status: "confirmed",
      fulfillment: "delivery",
      price_cents: 3600,
      notes: "Drop at office on Main St. GF packaging.",
      items: [
        { description: "GF chocolate cupcakes", quantity: 6 },
        { description: "GF vanilla cupcakes", quantity: 6 },
      ],
    },
    {
      customer: "Parker family",
      due: atTime(plus(-1), 15, 0),
      status: "picked_up",
      fulfillment: "pickup",
      price_cents: 1600,
      notes: "Paid cash.",
      items: [{ description: "Cinnamon rolls", quantity: 6 }],
    },
  ];

  const sat = (weeksOut: number) => onWeekday(today, 6, weeksOut);
  const mon = (weeksOut: number) => onWeekday(today, 1, weeksOut);
  const tue = (weeksOut: number) => onWeekday(today, 2, weeksOut);
  const wed = (weeksOut: number) => onWeekday(today, 3, weeksOut);
  const thu = (weeksOut: number) => onWeekday(today, 4, weeksOut);
  const fri = (weeksOut: number) => onWeekday(today, 5, weeksOut);
  const sun = (weeksOut: number) => onWeekday(today, 0, weeksOut);

  const pushIfUpcoming = (order: SeedOrder) => {
    if (order.due.slice(0, 10) < today) return;
    const already = orders.some(
      (row) => row.customer === order.customer && row.due === order.due,
    );
    if (already) return;
    orders.push(order);
  };

  for (const week of [1, 2, 3]) {
    pushIfUpcoming({
      customer: "Elena Vasquez",
      due: atTime(sat(week), 9, 0),
      status: "confirmed",
      fulfillment: "pickup",
      price_cents: 1800,
      notes: "Standing Saturday sourdough. Extra dark crust.",
      items: [{ description: "Sourdough loaf", quantity: 2 }],
    });
    pushIfUpcoming({
      customer: "River Cafe",
      due: atTime(mon(week), 10, 30),
      status: "confirmed",
      fulfillment: "delivery",
      price_cents: 4800,
      notes: "Weekday drop. Back door.",
      items: [{ description: "Croissants", quantity: 24 }],
    });
    pushIfUpcoming({
      customer: "River Cafe",
      due: atTime(wed(week), 10, 30),
      status: "confirmed",
      fulfillment: "delivery",
      price_cents: 5200,
      notes: "Muffin mix as usual.",
      items: [
        { description: "Blueberry muffins", quantity: 24 },
        { description: "Lemon poppy muffins", quantity: 12 },
      ],
    });
    pushIfUpcoming({
      customer: "River Cafe",
      due: atTime(fri(week), 10, 30),
      status: "confirmed",
      fulfillment: "delivery",
      price_cents: 4800,
      notes: "Friday pastry case.",
      items: [{ description: "Croissants", quantity: 24 }],
    });
  }

  for (const week of [0, 1, 2, 3]) {
    pushIfUpcoming({
      customer: "Harbor School",
      due: atTime(fri(week), 8, 30),
      status: "confirmed",
      fulfillment: "delivery",
      price_cents: 3600,
      notes: "Nut-free. Office counter, not the kitchen.",
      items: [{ description: "Sourdough loaf", quantity: 8 }],
    });
    pushIfUpcoming({
      customer: "Benito's Deli",
      due: atTime(tue(week), 7, 0),
      status: "confirmed",
      fulfillment: "delivery",
      price_cents: 2800,
      notes: "Slice if there is time. Alley drop.",
      items: [{ description: "Sourdough loaf", quantity: 6 }],
    });
    pushIfUpcoming({
      customer: "Benito's Deli",
      due: atTime(thu(week), 7, 0),
      status: "confirmed",
      fulfillment: "delivery",
      price_cents: 2800,
      notes: "Thursday sandwich run.",
      items: [{ description: "Sourdough loaf", quantity: 6 }],
    });
  }

  pushIfUpcoming({
    customer: "Tom Nguyen",
    due: atTime(thu(1), 16, 0),
    status: "confirmed",
    fulfillment: "pickup",
    price_cents: 2200,
    notes: "Nut-free batch. Label clearly.",
    items: [{ description: "Chocolate chip cookies (nut-free)", quantity: 12 }],
  });
  pushIfUpcoming({
    customer: "Maya Chen",
    due: atTime(wed(2), 11, 0),
    status: "confirmed",
    fulfillment: "delivery",
    price_cents: 3600,
    notes: "Office on Main. GF packaging.",
    items: [
      { description: "GF chocolate cupcakes", quantity: 6 },
      { description: "GF vanilla cupcakes", quantity: 6 },
    ],
  });
  pushIfUpcoming({
    customer: "Parker family",
    due: atTime(sun(2), 14, 0),
    status: "inquiry",
    fulfillment: "pickup",
    price_cents: 7200,
    notes: "Cousin's birthday. Same chocolate cake, green frosting this time.",
    items: [{ description: "6-inch chocolate birthday cake", quantity: 1 }],
  });
  pushIfUpcoming({
    customer: "Joshua Hamm",
    due: atTime(fri(2), 17, 30),
    status: "inquiry",
    fulfillment: "pickup",
    price_cents: null,
    notes: "Cookie box for the weekend if the tray has extras.",
    items: [{ description: "Assorted cookies", quantity: 18 }],
  });
  pushIfUpcoming({
    customer: "Kim Alvarez",
    due: atTime(sat(3), 15, 0),
    status: "confirmed",
    fulfillment: "pickup",
    price_cents: 18000,
    notes: "Two-tier vanilla cake, berry filling. Flowers on Monday if we have them.",
    items: [{ description: "Two-tier vanilla event cake", quantity: 1 }],
  });
  pushIfUpcoming({
    customer: "River Cafe",
    due: atTime(sat(2), 9, 0),
    status: "confirmed",
    fulfillment: "delivery",
    price_cents: 6400,
    notes: "Saturday brunch case. Extra croissants.",
    items: [
      { description: "Croissants", quantity: 36 },
      { description: "Cinnamon rolls", quantity: 12 },
    ],
  });
  pushIfUpcoming({
    customer: "Elena Vasquez",
    due: atTime(tue(3), 9, 0),
    status: "inquiry",
    fulfillment: "pickup",
    price_cents: 1400,
    notes: "Might want focaccia for a dinner. Confirm Monday.",
    items: [{ description: "Focaccia", quantity: 1 }],
  });

  const insertOrder = db.prepare(
    `INSERT INTO orders (customer_id, due_at, status, fulfillment, price_cents, notes, created_at, updated_at)
     VALUES (@customer_id, @due_at, @status, @fulfillment, @price_cents, @notes, @created_at, @updated_at)`,
  );
  const insertItem = db.prepare(
    `INSERT INTO order_items (order_id, description, quantity, sort_order)
     VALUES (@order_id, @description, @quantity, @sort_order)`,
  );

  runTransaction(db, () => {
    for (const order of orders) {
      const info = insertOrder.run({
        customer_id: ids[order.customer],
        due_at: order.due,
        status: order.status,
        fulfillment: order.fulfillment,
        price_cents: order.price_cents,
        notes: order.notes,
        created_at: createdAt,
        updated_at: createdAt,
      });
      const orderId = Number(info.lastInsertRowid);
      order.items.forEach((item, index) => {
        insertItem.run({
          order_id: orderId,
          description: item.description,
          quantity: item.quantity,
          sort_order: index,
        });
      });
    }
  });
}
