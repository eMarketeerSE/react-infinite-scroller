import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types'

export default class InfiniteScroll extends Component {
    static propTypes = {
        element: PropTypes.string,
        hasMore: PropTypes.bool,
        initialLoad: PropTypes.bool,
        loadMore: PropTypes.func.isRequired,
        pageStart: PropTypes.number,
        threshold: PropTypes.number,
        useWindow: PropTypes.bool,
        resetPageLoader: PropTypes.bool,
        lockListener: PropTypes.bool
    };

    static defaultProps = {
        element: 'div',
        hasMore: false,
        initialLoad: true,
        pageStart: 0,
        threshold: 250,
        useWindow: true,
        resetPageLoader: false,
        lockListener: false
    };

    constructor(props) {
        super(props);
        this.attachedScroller = false;
        this.scrollListener = this.scrollListener.bind(this);
    }

    componentDidMount() {
        this.pageLoaded = this.props.pageStart;
        if(this.props.hasMore && !this.props.lockListener) this.attachScrollListener();
        if (this.props.initialLoad) {
          this.props.loadMore(this.pageLoaded);
        }
    }

    componentWillReceiveProps(nextProps) {
        const nextChildrenLength = nextProps.children ? nextProps.children.length : null
        const currentChildrenLength = this.props.children ? this.props.children.length : null
        const newItemsCount = nextProps.totalItemsCount || nextChildrenLength
        const oldItemsCount = this.props.totalItemsCount || currentChildrenLength
        if (nextProps.lockListener) {
            this.detachScrollListener();
        } else {
            if (newItemsCount !== oldItemsCount || nextProps.hasMore) {
                this.attachScrollListener();
            }
            if (nextProps.resetPageLoader && !this.props.resetPageLoader ) {
                this.attachScrollListener();
                this.pageLoaded = this.props.pageStart;
            }
        }
    }

    render() {
        const {
            children,
            element,
            hasMore,
            initialLoad,
            loader,
            loadMore,
            pageStart,
            threshold,
            useWindow,
            totalItemsCount,
            resetPageLoader,
            lockListener,
            ...props
        } = this.props;

        return React.createElement(element, props, children, hasMore && (loader || this._defaultLoader));
    }

    calculateTopPosition(el) {
        if(!el) {
            return 0;
        }
        return el.offsetTop + this.calculateTopPosition(el.offsetParent);
    }

    scrollListener() {
        const el = ReactDOM.findDOMNode(this);
        const scrollEl = window;

        let offset;
        if(this.props.useWindow) {
            var scrollTop = (scrollEl.pageYOffset !== undefined) ? scrollEl.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;
            offset = this.calculateTopPosition(el) + el.offsetHeight - scrollTop - window.innerHeight;
        } else {
            offset = el.scrollHeight - el.parentNode.scrollTop - el.parentNode.clientHeight;
        }

        if(offset < Number(this.props.threshold)) {
            if (typeof this.props.loadMore == 'function') {
              this.props.loadMore(this.pageLoaded += 1);
            }
            // Call loadMore after detachScrollListener to allow for non-async loadMore functions to run
            // I changed the location of the detachScrollListener because loadMore called twice
            this.detachScrollListener();
        }
    }

    attachScrollListener() {
        if (this.attachedScroller) return

        this.attachedScroller = true;
        let scrollEl = window;
        if(this.props.useWindow == false) {
            scrollEl = ReactDOM.findDOMNode(this).parentNode;
        }

        scrollEl.addEventListener('scroll', this.scrollListener);
        scrollEl.addEventListener('resize', this.scrollListener);
    }

    detachScrollListener() {
        if (!this.attachedScroller) return
        var scrollEl = window;
        if(this.props.useWindow == false) {
            scrollEl = ReactDOM.findDOMNode(this).parentNode;
        }
        this.attachedScroller = false;
        scrollEl.removeEventListener('scroll', this.scrollListener);
        scrollEl.removeEventListener('resize', this.scrollListener);
    }

    componentWillUnmount() {
        this.detachScrollListener();
    }

    // Set a defaut loader for all your `InfiniteScroll` components
    setDefaultLoader(loader) {
        this._defaultLoader = loader;
    }
}
