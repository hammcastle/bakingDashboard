import { addDaysKey, atTime, todayKey } from "./dates";
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
