import {Component, ErrorInfo, ReactNode} from 'react';

import logger from '@/data/service/Logger';

import Button from './Button';
import {errorFallback, errorMessage} from './ErrorBoundary.css';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render errors in its subtree and shows a fallback UI instead of crashing the whole application.
 * The DMX output keeps running in the main process either way.
 *
 * Place one boundary per view so a crash in one view is contained.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = {error: null};

  static getDerivedStateFromError(error: Error): State {
    return {error};
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error('Unhandled render error', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className={errorFallback}>
          <h2>Something went wrong</h2>
          <p className={errorMessage}>{this.state.error.message}</p>
          <Button onClick={() => this.setState({error: null})}>Try again</Button>
        </div>
      );
    }

    return this.props.children;
  }
}
