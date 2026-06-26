import vision from "@google-cloud/vision";

const PROJECT = process.env.GCP_PROJECT || "emerge-digital-web-7034";
const LOCATION = process.env.VISION_LOCATION || "europe-west1";
const PRODUCT_SET = process.env.VISION_PRODUCT_SET || "aquora-products";

// Query Vision API Product Search with an uploaded image (base64).
// Vision product-id is the Medusa product handle, so we return handles directly.
// Returns [] gracefully if Vision isn't configured/indexed yet (24-48h after import).
export async function visualSearch(imageBase64: string, max = 6): Promise<string[]> {
  try {
    const client = new vision.ImageAnnotatorClient();
    const productSetPath = `projects/${PROJECT}/locations/${LOCATION}/productSets/${PRODUCT_SET}`;
    const [result] = await client.batchAnnotateImages({
      requests: [
        {
          image: { content: Buffer.from(imageBase64, "base64") },
          features: [{ type: "PRODUCT_SEARCH" }],
          imageContext: { productSearchParams: { productSet: productSetPath, productCategories: ["general-v1"] } },
        },
      ],
    });
    const results = result.responses?.[0]?.productSearchResults?.results || [];
    const handles: string[] = [];
    for (const r of results) {
      const id = (r.product?.name || "").split("/").pop();
      if (id && !handles.includes(id)) handles.push(id);
      if (handles.length >= max) break;
    }
    return handles;
  } catch {
    return [];
  }
}
