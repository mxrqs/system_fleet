import { Button } from "@/components/ui/button";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import { Camera, CameraOff, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | undefined>(undefined);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  const stopScanner = useCallback(() => {
    try {
      controlsRef.current?.stop();
    } catch (_) {}
    controlsRef.current = null;
    setScanning(false);
  }, []);

  const startScanner = useCallback(async (deviceId?: string) => {
    if (!videoRef.current) return;
    stopScanner();
    setError(null);
    setScanning(true);

    try {
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      const controls = await reader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            const text = result.getText();
            setLastScanned(text);
            // Brief visual feedback then call onScan
            setTimeout(() => {
              onScan(text);
            }, 300);
          }
          if (err && !(err instanceof NotFoundException)) {
            console.warn("[Scanner] decode error:", err);
          }
        }
      );
      controlsRef.current = controls as unknown as { stop: () => void };
    } catch (e: any) {
      setError(e?.message ?? "Não foi possível acessar a câmera.");
      setScanning(false);
    }
  }, [onScan, stopScanner]);

  // Load available cameras
  useEffect(() => {
    BrowserMultiFormatReader.listVideoInputDevices()
      .then((devices) => {
        setCameras(devices);
        // Prefer back camera
        const back = devices.find((d) =>
          d.label.toLowerCase().includes("back") ||
          d.label.toLowerCase().includes("traseira") ||
          d.label.toLowerCase().includes("rear")
        );
        const chosen = back?.deviceId ?? devices[0]?.deviceId;
        setSelectedCamera(chosen);
        if (chosen) startScanner(chosen);
      })
      .catch(() => {
        setError("Não foi possível listar as câmeras disponíveis.");
      });

    return () => {
      stopScanner();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSwitchCamera = () => {
    if (cameras.length < 2) return;
    const currentIdx = cameras.findIndex((c) => c.deviceId === selectedCamera);
    const nextIdx = (currentIdx + 1) % cameras.length;
    const nextId = cameras[nextIdx].deviceId;
    setSelectedCamera(nextId);
    startScanner(nextId);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Camera viewport */}
      <div className="relative rounded-xl overflow-hidden bg-black aspect-video w-full">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          muted
          playsInline
        />

        {/* Scanning overlay */}
        {scanning && !error && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Corner guides */}
            <div className="relative w-48 h-32">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br" />
              {/* Scan line animation */}
              <div className="absolute inset-x-0 h-0.5 bg-primary/80 animate-bounce top-1/2" />
            </div>
          </div>
        )}

        {/* Last scanned flash */}
        {lastScanned && (
          <div className="absolute bottom-2 inset-x-2 bg-green-500/90 text-white text-xs font-mono text-center py-1.5 px-3 rounded-lg">
            ✓ {lastScanned}
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white gap-3 p-4">
            <CameraOff className="h-10 w-10 opacity-60" />
            <p className="text-sm text-center">{error}</p>
            <Button
              size="sm"
              variant="outline"
              className="text-white border-white/40 hover:bg-white/10"
              onClick={() => startScanner(selectedCamera)}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Tentar novamente
            </Button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${scanning ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
          <span className="text-xs text-muted-foreground">
            {scanning ? "Escaneando..." : "Câmera inativa"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {cameras.length > 1 && (
            <Button size="sm" variant="outline" onClick={handleSwitchCamera} className="gap-1.5 text-xs h-8">
              <RefreshCw className="h-3.5 w-3.5" />
              Trocar câmera
            </Button>
          )}
          {!scanning && !error && (
            <Button size="sm" variant="outline" onClick={() => startScanner(selectedCamera)} className="gap-1.5 text-xs h-8">
              <Camera className="h-3.5 w-3.5" />
              Iniciar
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onClose} className="gap-1.5 text-xs h-8">
            <X className="h-3.5 w-3.5" />
            Fechar
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Aponte a câmera para o código de barras do item. O código será detectado automaticamente.
      </p>
    </div>
  );
}
