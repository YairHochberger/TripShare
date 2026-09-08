export default function Input(props) {
  return (
    <input
      className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
      {...props}
    />
  );
}