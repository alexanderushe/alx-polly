export default function QRCodeCard({ pollUrl }: { pollUrl: string }) {
  return (
    <div className="p-4 border rounded">
      <h3>Scan to Vote</h3>
      <img src={`https://api.qrserver.com/v1/create-qr-code/?data=${pollUrl}&size=150x150`} alt="QR Code" />
    </div>
  );
}