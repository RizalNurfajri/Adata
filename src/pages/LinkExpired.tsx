import { Link } from "react-router-dom"
import { RefreshCw, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LinkExpired() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="w-full max-w-lg border-muted/40">
        <CardHeader className="text-center">
          <img
            src="https://i.imgur.com/wfqAcM7.png"
            alt="Link expired illustration"
            className="mx-auto mb-4 w-40 h-auto"
          />
          <CardTitle className="text-xl font-semibold">
            Login Link Expired
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Tautan login/verifikasi sudah kadaluarsa atau tidak valid.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Jangan khawatir, kamu bisa registrasi ulang atau minta tautan baru.
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
            Masih bermasalah? Hubungi admin untuk bantuan lebih lanjut.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
