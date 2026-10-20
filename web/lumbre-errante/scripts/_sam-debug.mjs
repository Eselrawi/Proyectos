import { SamModel, AutoProcessor, RawImage } from "@huggingface/transformers";
import sharp from "sharp";
const N = 512;
const model = await SamModel.from_pretrained("Xenova/slimsam-77-uniform", { dtype: "fp32" });
const proc = await AutoProcessor.from_pretrained("Xenova/slimsam-77-uniform");
const png = await sharp("C:/Users/raulg/proyectos/web/restaurante/public/dishes/curry/color.webp").resize(N, N).png().toBuffer();
const image = await RawImage.fromBlob(new Blob([png]));
const inputs = await proc(image);
console.log("orig", inputs.original_sizes, "reshaped", inputs.reshaped_input_sizes);
const emb = await model.get_image_embeddings(inputs);
const pr = await proc(image, { input_points: [[[0.7 * N, 0.6 * N]]] });
console.log("points", pr.input_points.dims, pr.input_labels?.dims);
const out = await model({ ...emb, input_points: pr.input_points, input_labels: pr.input_labels });
console.log("pred_masks", out.pred_masks.dims, "iou", out.iou_scores.dims, Array.from(out.iou_scores.data));
const masks = await proc.post_process_masks(out.pred_masks, inputs.original_sizes, inputs.reshaped_input_sizes);
console.log("masks", masks.length, masks[0].dims, masks[0].type, masks[0].data.length);
const d = masks[0].data;
for (let b = 0; b < 3; b++) {
  const buf = Buffer.alloc(N * N);
  for (let i = 0; i < N * N; i++) buf[i] = d[b * N * N + i] ? 255 : 0;
  await sharp(buf, { raw: { width: N, height: N, channels: 1 } }).png().toFile(`C:/Users/raulg/AppData/Local/Temp/claude/C--Users-raulg-proyectos-web-restaurante/e6a9c056-b145-420d-9fed-b8ff75be3f4e/scratchpad/m${b}.png`);
}
console.log("types", d.constructor.name, Array.from(d.slice(0, 20)));
