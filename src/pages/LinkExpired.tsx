import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export default function LinkExpired() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      {/* Image illustration */}
      <img
        src="https://i.imgur.com/V9Y3g31.png"
        alt="Login link expired illustration"
        className="w-64 h-auto mb-6"
      />

      {/* Title */}
      <h1 className="text-2xl font-semibold text-center mb-2">
        Register Link Expired
      </h1>

      {/* Description */}
      <p className="text-center text-muted-foreground max-w-md mb-6 text-sm">
        Halo, tautan registrasi Kamu sudah kedaluwarsa karena belum digunakan.
        Tautan registrasi akan kedaluwarsa setiap 5 menit dan hanya bisa digunakan satu kali.
        Kamu dapat meminta tautan baru dengan mengklik tombol di bawah ini.
      </p>

      {/* Button */}
      <Link to="/login">
        <Button className="px-6 py-2 text-sm">
          MINTA LINK BARU
        </Button>
      </Link>

      {/* Footer help text */}
      <p className="text-xs text-muted-foreground text-center mt-6">
        If this issue continue to persist,{" "}
        <a href="#" className="text-primary hover:underline">
          let us know
        </a>.
      </p>
    </div>
  )
}
