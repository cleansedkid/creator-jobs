export default function PaymentNoticeBanner({
	title,
	message,
	tone = "neutral",
 }: {
	title: string;
	message: string;
	tone?: "success" | "warning" | "neutral";
 }) {
	const toneClasses =
	  tone === "success"
		 ? "border-green-500/20 bg-green-500/10"
		 : tone === "warning"
		 ? "border-yellow-500/20 bg-yellow-500/10"
		 : "border-white/10 bg-white/5";
 
	return (
	  <div className={`rounded-xl border p-4 ${toneClasses}`}>
		 <div className="text-sm font-medium">{title}</div>
		 <p className="mt-1 text-sm text-muted-foreground">{message}</p>
	  </div>
	);
 }