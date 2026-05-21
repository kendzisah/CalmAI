import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { track, captureException } from '@/lib/analytics';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(err: Error, errorInfo: React.ErrorInfo) {
    captureException(err, { component_stack: errorInfo.componentStack });
    track('unhandled_error', { message: err.message });
  }

  reset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>The app hit an unexpected error. Try reloading.</Text>
          <Pressable style={styles.button} onPress={this.reset}>
            <Text style={styles.buttonText}>Reload</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#FFF8F0' },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 8, color: '#1A1A1A' },
  body: { fontSize: 15, textAlign: 'center', color: '#555', marginBottom: 24 },
  button: { backgroundColor: '#7C5CBF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
