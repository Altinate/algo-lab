import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class CryptoErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });
    console.error('CryptoScope System Fault:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#090c10] text-[#f8fafc] font-mono flex items-center justify-center p-4">
          <div className="w-full max-w-2xl border border-[#374151] bg-[#0c1017] p-6 rounded-[2px] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1f2937] pb-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 bg-[#e5a93b] animate-pulse rounded-none" />
                <h1 className="text-sm font-semibold tracking-wider text-[#e5a93b] uppercase">
                  CRYPTOSCOPE // TELEMETRY ENGINE EXCEPTION
                </h1>
              </div>
              <span className="text-[10px] text-[#6b7280] tracking-widest uppercase">
                FAULT CODE: RUNTIME_ERR
              </span>
            </div>

            <p className="text-xs text-[#9ca3af] leading-relaxed">
              An unexpected execution fault occurred within the client-side telemetry rendering pipeline.
              No cryptographic keys, plaintexts, or memory states were compromised.
            </p>

            {this.state.error && (
              <div className="border border-[#1f2937] bg-[#090c10] p-3 rounded-[2px] space-y-2">
                <div className="text-[11px] text-[#e5a93b] font-medium">
                  {this.state.error.name}: {this.state.error.message}
                </div>
                {this.state.error.stack && (
                  <pre className="text-[10px] text-[#6b7280] overflow-x-auto max-h-48 whitespace-pre-wrap leading-tight">
                    {this.state.error.stack.split('\n').slice(0, 8).join('\n')}
                  </pre>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-[#4b5563]">
                STATE MEMORY REMAINS AIR-GAPPED & LOCAL
              </span>
              <button
                onClick={this.handleReset}
                className="px-4 py-1.5 bg-[#1f2937] hover:bg-[#374151] border border-[#4b5563] text-xs text-[#f8fafc] font-medium rounded-[2px] transition-colors"
              >
                RELOAD INSTRUMENT
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
