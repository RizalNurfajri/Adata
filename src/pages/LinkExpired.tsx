import { Link } from "react-router-dom"
import { AlertTriangle, RefreshCw, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LinkExpired() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="w-full max-w-lg border-destructive/30">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">Link Expired</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Tautan verifikasi/email login sudah tidak berlaku atau invalid.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Tenang, kamu bisa daftar ulang atau minta tautan baru.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link to="/register" className="w-full">
              <Button className="w-full" variant="default">
                <LogIn className="w-4 h-4 mr-2" />
                Registrasi Ulang
              </Button>
            </Link>
            <Link to="/login" className="w-full">
              <Button className="w-full" variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Kirim Link Baru
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Butuh bantuan? Hubungi admin jika masalah tetap muncul.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
