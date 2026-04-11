import { Redirect } from 'expo-router';

// This tab just opens the breathe modal — it's never rendered as a screen
export default function BreatheTab() {
  return <Redirect href="/breathe" />;
}
