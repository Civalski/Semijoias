import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";

/** Mesma proporção das fotos na loja (cards / produto). */
const ASPECT = 3 / 4;
const OUT_W = 1200;
const OUT_H = 1600;

let cropperInstance: Cropper | null = null;
let revokeUrl: string | null = null;
let escapeHandler: ((e: KeyboardEvent) => void) | null = null;

function cleanupBlob(): void {
	if (revokeUrl) {
		URL.revokeObjectURL(revokeUrl);
		revokeUrl = null;
	}
}

function getModalEls() {
	return {
		modal: document.getElementById("admin-crop-modal"),
		backdrop: document.getElementById("admin-crop-backdrop"),
		img: document.getElementById("admin-crop-img") as HTMLImageElement | null,
		cancel: document.getElementById("admin-crop-cancel"),
		apply: document.getElementById("admin-crop-apply"),
	};
}

function blobToDataUrl(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const r = new FileReader();
		r.onload = () => resolve(String(r.result));
		r.onerror = () => reject(new Error("Falha ao ler a imagem."));
		r.readAsDataURL(blob);
	});
}

async function canvasToHighQualityDataUrl(
	canvas: HTMLCanvasElement,
): Promise<string> {
	const toBlob = (type: string, q: number) =>
		new Promise<Blob | null>((res) => canvas.toBlob(res, type, q));
	const webp = await toBlob("image/webp", 0.9);
	if (webp && webp.size > 0) return blobToDataUrl(webp);
	const jpeg = await toBlob("image/jpeg", 0.92);
	if (!jpeg?.size) throw new Error("Não foi possível gerar a imagem otimizada.");
	return blobToDataUrl(jpeg);
}

/**
 * Abre o modal de enquadramento (zoom + arrastar, área fixa 3:4).
 * @returns data URL otimizada ou `null` se cancelar / erro.
 */
export function openProductImageCrop(source: File | string): Promise<string | null> {
	return new Promise((resolve) => {
		const { modal, backdrop, img, cancel, apply } = getModalEls();
		if (!modal || !img || !cancel || !apply) {
			resolve(null);
			return;
		}

		let settled = false;
		const finish = (value: string | null) => {
			if (settled) return;
			settled = true;
			if (escapeHandler) {
				document.removeEventListener("keydown", escapeHandler);
				escapeHandler = null;
			}
			backdrop?.removeEventListener("click", onBackdrop);
			cropperInstance?.destroy();
			cropperInstance = null;
			img.src = "";
			img.removeAttribute("crossorigin");
			cleanupBlob();
			modal.classList.add("hidden");
			document.body.classList.remove("overflow-hidden");
			cancel.removeEventListener("click", onCancel);
			apply.removeEventListener("click", onApply);
			resolve(value);
		};

		const onCancel = () => finish(null);

		const onApply = async () => {
			if (!cropperInstance) return;
			const canvas = cropperInstance.getCroppedCanvas({
				width: OUT_W,
				height: OUT_H,
				imageSmoothingEnabled: true,
				imageSmoothingQuality: "high",
			});
			if (!canvas) {
				window.alert("Não foi possível gerar o recorte.");
				return;
			}
			try {
				const dataUrl = await canvasToHighQualityDataUrl(canvas);
				finish(dataUrl);
			} catch (e) {
				window.alert(
					e instanceof Error ? e.message : "Erro ao exportar a imagem.",
				);
			}
		};

		const onBackdrop = (e: MouseEvent) => {
			if (e.target === backdrop) finish(null);
		};

		const bindCropper = () => {
			cropperInstance?.destroy();
			cropperInstance = new Cropper(img, {
				aspectRatio: ASPECT,
				viewMode: 1,
				dragMode: "move",
				autoCropArea: 1,
				responsive: true,
				background: false,
				movable: true,
				zoomable: true,
				zoomOnTouch: true,
				zoomOnWheel: true,
				wheelZoomRatio: 0.08,
				rotatable: false,
				scalable: false,
				toggleDragModeOnDblclick: false,
			});
		};

		const startCrop = (src: string) => {
			if (src.startsWith("blob:") || src.startsWith("data:")) {
				img.removeAttribute("crossorigin");
			} else {
				img.crossOrigin = "anonymous";
			}

			const run = () => {
				bindCropper();
			};

			img.onload = run;
			img.onerror = () => {
				window.alert("Não foi possível carregar a imagem para enquadrar.");
				finish(null);
			};
			img.src = src;
		};

		cancel.addEventListener("click", onCancel);
		apply.addEventListener("click", onApply);
		backdrop?.addEventListener("click", onBackdrop);

		escapeHandler = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.preventDefault();
				finish(null);
			}
		};
		document.addEventListener("keydown", escapeHandler);

		document.body.classList.add("overflow-hidden");
		modal.classList.remove("hidden");

		void (async () => {
			try {
				let urlToUse: string;

				if (source instanceof File) {
					const maxIn = 6 * 1024 * 1024;
					if (source.size > maxIn) {
						window.alert(
							"Arquivo muito grande. Use uma imagem de até cerca de 6 MB.",
						);
						finish(null);
						return;
					}
					if (!source.type.startsWith("image/")) {
						window.alert("Selecione um arquivo de imagem.");
						finish(null);
						return;
					}
					urlToUse = URL.createObjectURL(source);
					revokeUrl = urlToUse;
					startCrop(urlToUse);
					return;
				}

				if (source.startsWith("data:")) {
					startCrop(source);
					return;
				}

				if (source.startsWith("http://") || source.startsWith("https://")) {
					const res = await fetch(source, { mode: "cors" });
					if (!res.ok) throw new Error("fetch");
					const blob = await res.blob();
					if (!blob.type.startsWith("image/")) {
						throw new Error("not-image");
					}
					urlToUse = URL.createObjectURL(blob);
					revokeUrl = urlToUse;
					startCrop(urlToUse);
					return;
				}

				window.alert(
					"Não é possível enquadrar esta origem. Use uma URL http(s), data URL ou envie um arquivo.",
				);
				finish(null);
			} catch {
				window.alert(
					"Não foi possível carregar a imagem. Se for um link externo, o servidor precisa permitir o acesso (CORS). Nesse caso, baixe a foto e envie pelo campo de arquivo.",
				);
				finish(null);
			}
		})();
	});
}
