import { create } from "zustand";
import { BodyProfile, FitPreference, GarmentSpec } from "@rober/fit-engine";
import {
  calculateCartTotals,
  CartTotals,
  defaultFavoriteJeansInput,
  resolveFavoriteJeans,
  resolveGarmentReference,
} from "@rober/api-client";

export type StyleProfile = {
  styleTags: string[];
  dislikedTags: string[];
  colorPreferences: string[];
  materialPreferences: string[];
  occasionPreferences: string[];
  favoriteBrands: string[];
  priceMin?: number;
  priceMax?: number;
  budgetLabel?: string;
};

export type MatchPath = "garment_to_garment" | "body_to_garment";

export type KnownGoodItem = {
  id: string;
  brand: string;
  category: string;
  itemName: string;
  sizeLabel: string;
  fitNotes: string;
  measurements: {
    chestCm?: number;
    waistCm?: number;
    hipCm?: number;
    shoulderCm?: number;
    inseamCm?: number;
  };
  canonicalSpec?: GarmentSpec;
  resolvedFromCatalog?: boolean;
  matchPath?: MatchPath;
};

type DemoUserState = {
  guestMode: boolean;
  onboardingCompleted: boolean;
  bodyProfile: BodyProfile;
  styleProfile: StyleProfile;
  knownGoodItems: KnownGoodItem[];
  savedProductIds: string[];
  cartItems: DemoCartItem[];
  orders: DemoOrder[];
  setGuestMode: (guestMode: boolean) => void;
  updateBodyProfile: (profile: Partial<BodyProfile>) => void;
  updateFitPreference: (fitPreference: FitPreference) => void;
  updateStyleProfile: (profile: Partial<StyleProfile>) => void;
  addKnownGoodItem: (item: KnownGoodItem) => void;
  toggleSavedProduct: (productId: string) => void;
  addToCart: (item: Omit<DemoCartItem, "quantity">) => void;
  updateCartQuantity: (variantId: string, quantity: number) => void;
  removeCartItem: (variantId: string) => void;
  createOrderFromCart: () => DemoOrder;
  submitFitFeedback: (orderItemId: string, feedback: FitFeedback) => void;
  completeOnboarding: () => void;
};

export type FitFeedback = "too_small" | "true_to_size" | "too_large";

export type DemoCartItem = {
  productId: string;
  variantId: string;
  sizeLabel: string;
  color: string;
  unitPriceCents: number;
  fitConfidenceWhenAdded: number;
  quantity: number;
};

export type DemoOrderItem = DemoCartItem & {
  id: string;
  fitFeedback?: FitFeedback;
};

export type DemoOrder = {
  id: string;
  status: "paid" | "shipped" | "delivered";
  createdAt: string;
  items: DemoOrderItem[];
  totals: CartTotals;
};

const demoFavoriteJeans = resolveFavoriteJeans(defaultFavoriteJeansInput);
const demoGarmentReference = resolveGarmentReference({
  brandSlug: defaultFavoriteJeansInput.brandSlug,
  modelName: "501",
  sizeLabel: defaultFavoriteJeansInput.sizeLabel,
  ...(defaultFavoriteJeansInput.inseamIn !== undefined
    ? { inseamIn: defaultFavoriteJeansInput.inseamIn }
    : {}),
});

export const demoBodyProfile: BodyProfile = {
  heightCm: 178,
  weightKg: 77,
  chestCm: 101,
  waistCm: demoFavoriteJeans.waistCm,
  hipCm: demoFavoriteJeans.hipCm,
  inseamCm: demoFavoriteJeans.inseamCm,
  shoulderCm: 46,
  shoeSizeUs: 10.5,
  fitPreference: "regular",
};

export const demoStyleProfile: StyleProfile = {
  styleTags: ["denim", "straight", "everyday", "heritage"],
  dislikedTags: ["loud logos"],
  colorPreferences: ["light blue", "dark wash", "washed black", "medium wash"],
  materialPreferences: ["denim", "cotton", "stretch denim"],
  occasionPreferences: ["everyday", "weekend errands", "travel"],
  favoriteBrands: [
    "Marlow Denim",
    "Loom & Line",
    "Range Standard",
    "Harbor Denim",
  ],
  priceMin: 40,
  priceMax: 160,
  budgetLabel: "Jeans under $160",
};

export const demoKnownGoodItems: KnownGoodItem[] = [
  {
    id: "known-favorite-jeans",
    brand: demoFavoriteJeans.brandName,
    category: "bottoms",
    itemName: "501 Original Fit Jean",
    sizeLabel: `${demoFavoriteJeans.sizeLabel}x${Math.round(demoFavoriteJeans.inseamCm / 2.54)}`,
    fitNotes:
      "Levi's 501 baseline: waist sits clean, no hip pulling, and the inseam breaks once at the shoe.",
    measurements: {
      waistCm: demoFavoriteJeans.waistCm,
      hipCm: demoFavoriteJeans.hipCm,
      inseamCm: demoFavoriteJeans.inseamCm,
    },
    canonicalSpec: demoGarmentReference.spec,
    resolvedFromCatalog: demoGarmentReference.resolvedFromCatalog,
    matchPath: "garment_to_garment",
  },
  {
    id: "known-regular-jeans",
    brand: "Loom & Line",
    category: "bottoms",
    itemName: "Regular straight jeans",
    sizeLabel: "32x32",
    fitNotes: "True waist, enough thigh room, breaks once at shoe.",
    measurements: {
      waistCm: 86,
      hipCm: 101,
      inseamCm: 81,
    },
    matchPath: "body_to_garment",
  },
];

export const useDemoStore = create<DemoUserState>((set) => ({
  guestMode: true,
  onboardingCompleted: false,
  bodyProfile: demoBodyProfile,
  styleProfile: demoStyleProfile,
  knownGoodItems: demoKnownGoodItems,
  savedProductIds: [
    "madewell-perfect-vintage-straight",
    "lee-rider-loose-straight",
    "ae-curvy-straight",
  ],
  cartItems: [],
  orders: [
    {
      id: "order-demo-1007",
      status: "delivered",
      createdAt: "2026-06-24T14:22:00.000Z",
      items: [
        {
          id: "order-demo-1007-item-1",
          productId: "madewell-perfect-vintage-straight",
          variantId: "madewell-perfect-vintage-straight-29-32",
          sizeLabel: "29x32",
          color: "light blue",
          unitPriceCents: 13800,
          fitConfidenceWhenAdded: 91,
          quantity: 1,
          fitFeedback: "true_to_size",
        },
      ],
      totals: calculateCartTotals(
        [
          {
            productId: "madewell-perfect-vintage-straight",
            variantId: "madewell-perfect-vintage-straight-29-32",
            unitPriceCents: 13800,
            quantity: 1,
          },
        ],
        "ROBERFIT",
      ),
    },
  ],
  setGuestMode: (guestMode) => set({ guestMode }),
  updateBodyProfile: (profile) =>
    set((state) => ({
      bodyProfile: {
        ...state.bodyProfile,
        ...profile,
      },
    })),
  updateFitPreference: (fitPreference) =>
    set((state) => ({
      bodyProfile: {
        ...state.bodyProfile,
        fitPreference,
      },
    })),
  updateStyleProfile: (profile) =>
    set((state) => ({
      styleProfile: {
        ...state.styleProfile,
        ...profile,
      },
    })),
  addKnownGoodItem: (item) =>
    set((state) => ({
      knownGoodItems: [
        item,
        ...state.knownGoodItems.filter((knownItem) => knownItem.id !== item.id),
      ],
    })),
  toggleSavedProduct: (productId) =>
    set((state) => ({
      savedProductIds: state.savedProductIds.includes(productId)
        ? state.savedProductIds.filter((id) => id !== productId)
        : [productId, ...state.savedProductIds],
    })),
  addToCart: (item) =>
    set((state) => {
      const existing = state.cartItems.find(
        (cartItem) => cartItem.variantId === item.variantId,
      );
      if (existing) {
        return {
          cartItems: state.cartItems.map((cartItem) =>
            cartItem.variantId === item.variantId
              ? { ...cartItem, quantity: cartItem.quantity + 1 }
              : cartItem,
          ),
        };
      }
      return {
        cartItems: [{ ...item, quantity: 1 }, ...state.cartItems],
      };
    }),
  updateCartQuantity: (variantId, quantity) =>
    set((state) => ({
      cartItems: state.cartItems
        .map((item) =>
          item.variantId === variantId
            ? { ...item, quantity: Math.max(0, quantity) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    })),
  removeCartItem: (variantId) =>
    set((state) => ({
      cartItems: state.cartItems.filter((item) => item.variantId !== variantId),
    })),
  createOrderFromCart: () => {
    let createdOrder: DemoOrder | undefined;
    set((state) => {
      const items = state.cartItems.length
        ? state.cartItems
        : [
            {
              productId: "madewell-perfect-vintage-straight",
              variantId: "madewell-perfect-vintage-straight-29-32",
              sizeLabel: "29x32",
              color: "light blue",
              unitPriceCents: 13800,
              fitConfidenceWhenAdded: 91,
              quantity: 1,
            },
          ];
      const orderItems = items.map((item, index) => ({
        ...item,
        id: `order-${Date.now()}-item-${index + 1}`,
      }));
      createdOrder = {
        id: `order-${Date.now()}`,
        status: "paid",
        createdAt: new Date().toISOString(),
        items: orderItems,
        totals: calculateCartTotals(items, "ROBERFIT"),
      };
      return {
        orders: [createdOrder, ...state.orders],
        cartItems: [],
      };
    });
    if (!createdOrder) {
      throw new Error("Unable to create demo order");
    }
    return createdOrder;
  },
  submitFitFeedback: (orderItemId, feedback) =>
    set((state) => ({
      orders: state.orders.map((order) => ({
        ...order,
        items: order.items.map((item) =>
          item.id === orderItemId ? { ...item, fitFeedback: feedback } : item,
        ),
      })),
    })),
  completeOnboarding: () => set({ onboardingCompleted: true }),
}));
