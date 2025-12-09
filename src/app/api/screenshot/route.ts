import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, x, y, xPx, yPx, viewportWidth, viewportHeight, scrollX, scrollY } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL é obrigatória" },
        { status: 400 }
      );
    }

    // Configurações do viewport - usar dimensões EXATAS enviadas pelo cliente
    const rawWidth = Number(viewportWidth) || 1440;
    const rawHeight = Number(viewportHeight) || 900;

    // Puppeteer requer inteiros positivos (mínimo técnico de 1, mas usamos 320 como mínimo prático para mobile)
    const width = Math.max(320, Math.round(rawWidth));
    const height = Math.max(320, Math.round(rawHeight));

    console.log(`[Screenshot API] Capturando com viewport: ${width}x${height}`);
    console.log(`[Screenshot API] Coordenadas recebidas: x=${x}, y=${y}, xPx=${xPx}, yPx=${yPx}`);

    // Lançar navegador headless com configurações otimizadas
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
        "--window-size=1920,1080",
      ],
    });

    const page = await browser.newPage();

    // Bloquear recursos desnecessários para acelerar carregamento
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const resourceType = req.resourceType();
      // Bloquear apenas fontes externas e mídia pesada, permitir tudo mais
      if (resourceType === "media") {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Habilitar JavaScript
    await page.setJavaScriptEnabled(true);

    // Configurar viewport
    await page.setViewport({
      width,
      height,
      deviceScaleFactor: 1,
    });

    // Configurar User-Agent para parecer um navegador real
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Navegar para a URL com múltiplas estratégias de espera
    await page.goto(url, {
      waitUntil: "networkidle0", // Espera até não haver mais requisições de rede
      timeout: 45000,
    });

    // Aguardar o DOM estar completamente carregado
    await page.waitForFunction(
      () => document.readyState === "complete",
      { timeout: 10000 }
    ).catch(() => {
      // Ignora erro se já passou do tempo
    });

    // Aguardar um tempo extra para renderização de JS/CSS
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Tentar aguardar o body ter conteúdo visível
    await page.waitForSelector("body", { timeout: 5000 }).catch(() => {});

    // Aguardar imagens carregarem
    await page.evaluate(async () => {
      const images = Array.from(document.querySelectorAll("img"));
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.addEventListener("load", resolve);
            img.addEventListener("error", resolve);
            // Timeout de 3s por imagem
            setTimeout(resolve, 3000);
          });
        })
      );
    }).catch(() => {});

    // Aguardar mais um pouco para animações CSS terminarem
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Se houver posição de scroll, aplicar
    if (scrollX || scrollY) {
      await page.evaluate(
        (sx, sy) => {
          window.scrollTo(sx || 0, sy || 0);
        },
        scrollX,
        scrollY
      );
      // Aguardar um pouco para o scroll aplicar
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Capturar screenshot
    const screenshotBuffer = await page.screenshot({
      type: "png",
      fullPage: false, // Apenas a viewport visível
    });

    await browser.close();

    // Converter para base64
    const base64Screenshot = Buffer.from(screenshotBuffer).toString("base64");

    // Se tiver coordenadas do clique, adicionar marcador
    let finalScreenshot = `data:image/png;base64,${base64Screenshot}`;

    if (typeof x === "number" && typeof y === "number") {
      // Desenhar o marcador no servidor usando canvas
      const { createCanvas, loadImage } = await import("canvas");

      const img = await loadImage(Buffer.from(screenshotBuffer));
      const canvas = createCanvas(img.width, img.height);
      const ctx = canvas.getContext("2d");

      // Desenhar a imagem original
      ctx.drawImage(img, 0, 0);

      // USAR coordenadas em PIXELS se disponíveis, senão calcular de percentual
      // Isso garante precisão absoluta no ponto clicado
      let clickX: number;
      let clickY: number;

      if (typeof xPx === "number" && typeof yPx === "number") {
        // Usar coordenadas absolutas em pixels (mais preciso)
        clickX = xPx;
        clickY = yPx;
        console.log(`[Screenshot API] Usando coordenadas em pixels: ${clickX}, ${clickY}`);
      } else {
        // Fallback: calcular de percentual
        clickX = (x / 100) * img.width;
        clickY = (y / 100) * img.height;
        console.log(`[Screenshot API] Calculando de percentual: ${clickX.toFixed(0)}, ${clickY.toFixed(0)}`);
      }

      // Desenhar círculo externo (área de destaque)
      ctx.beginPath();
      ctx.arc(clickX, clickY, 35, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
      ctx.fill();

      // Desenhar círculo médio
      ctx.beginPath();
      ctx.arc(clickX, clickY, 25, 0, 2 * Math.PI);
      ctx.strokeStyle = "#EF4444";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Desenhar círculo interno (ponto)
      ctx.beginPath();
      ctx.arc(clickX, clickY, 8, 0, 2 * Math.PI);
      ctx.fillStyle = "#EF4444";
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Desenhar linhas guia (opcionais - tracejadas)
      ctx.setLineDash([8, 4]);
      ctx.strokeStyle = "rgba(239, 68, 68, 0.5)";
      ctx.lineWidth = 1;

      // Linha horizontal
      ctx.beginPath();
      ctx.moveTo(0, clickY);
      ctx.lineTo(img.width, clickY);
      ctx.stroke();

      // Linha vertical
      ctx.beginPath();
      ctx.moveTo(clickX, 0);
      ctx.lineTo(clickX, img.height);
      ctx.stroke();

      finalScreenshot = canvas.toDataURL("image/png");
    }

    return NextResponse.json({
      success: true,
      screenshot: finalScreenshot,
    });
  } catch (error) {
    console.error("Erro ao capturar screenshot:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao capturar screenshot",
      },
      { status: 500 }
    );
  }
}
