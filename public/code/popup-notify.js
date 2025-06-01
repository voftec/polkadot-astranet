/**
 * PopupNotify - A lightweight, customizable notification framework
 * Version 1.0.0
 * 
 * A modern ES6+ JavaScript library for displaying attractive popup notifications
 * with customizable appearance, behavior, and positioning.
 */

class PopupNotify {
  /**
   * Creates a new PopupNotify instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    // Default configuration
    this.defaults = {
      position: 'top-right',      // Position of notifications: 'top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'
      duration: 5000,             // Duration in ms (0 for persistent notifications)
      animationDuration: 300,     // Animation duration in ms
      maxNotifications: 5,        // Maximum number of notifications displayed simultaneously
      theme: 'light',             // Theme: 'light', 'dark', or 'auto' (follows system preference)
      closeOnClick: true,         // Whether notifications close when clicked
      showCloseButton: true,      // Whether to show a close button
      pauseOnHover: true,         // Pause timeout when hovering
      newestOnTop: true,          // Whether new notifications appear on top
      container: document.body,   // Container element for notifications
      zIndex: 1000,               // Base z-index for notifications
      iconEnabled: true,          // Whether to show icons
      soundEnabled: false,        // Whether to play sounds
      soundPath: null,            // Path to sound files
    };

    // Merge provided options with defaults
    this.config = { ...this.defaults, ...options };
    
    // Initialize containers
    this.initializeContainers();
    
    // Track active notifications
    this.activeNotifications = [];
    
    // Counter for unique IDs
    this.counter = 0;
  }

  /**
   * Initialize notification containers for different positions
   * @private
   */
  initializeContainers() {
    // Create main container
    this.mainContainer = document.createElement('div');
    this.mainContainer.className = 'popup-notify-container';
    this.mainContainer.setAttribute('data-theme', this.config.theme);
    this.mainContainer.style.zIndex = this.config.zIndex;
    
    // Create position-specific containers
    this.containers = {};
    const positions = ['top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'];
    
    positions.forEach(position => {
      const container = document.createElement('div');
      container.className = `popup-notify-position popup-notify-${position}`;
      this.mainContainer.appendChild(container);
      this.containers[position] = container;
    });
    
    // Append to specified container
    this.config.container.appendChild(this.mainContainer);
  }

  /**
   * Show a notification
   * @param {Object} options - Notification options
   * @returns {string} Notification ID
   */
  show(options = {}) {
    // Generate unique ID
    const id = `notification-${Date.now()}-${this.counter++}`;
    
    // Default notification options
    const defaults = {
      title: '',                  // Notification title
      message: '',                // Notification message
      type: 'info',               // Type: 'info', 'success', 'warning', 'error', or custom
      icon: null,                 // Custom icon (URL or element)
      position: this.config.position,
      duration: this.config.duration,
      closeOnClick: this.config.closeOnClick,
      showCloseButton: this.config.showCloseButton,
      pauseOnHover: this.config.pauseOnHover,
      onClick: null,              // Click callback
      onClose: null,              // Close callback
      customClass: '',            // Additional CSS class
      html: false,                // Whether to interpret message as HTML
      actions: [],                // Action buttons [{label, action, class}]
      progress: true,             // Whether to show progress bar
      data: {},                   // Custom data to attach to notification
    };
    
    // Merge options
    const notificationOptions = { ...defaults, ...options, id };
    
    // Create notification element
    const notification = this.createNotificationElement(notificationOptions);
    
    // Add to appropriate container
    const container = this.containers[notificationOptions.position];
    
    if (this.config.newestOnTop) {
      container.prepend(notification);
    } else {
      container.appendChild(notification);
    }
    
    // Manage maximum notifications
    this.manageNotificationLimit();
    
    // Add to active notifications
    this.activeNotifications.push({
      id,
      element: notification,
      options: notificationOptions,
      timer: null
    });
    
    // Start timeout if duration > 0
    if (notificationOptions.duration > 0) {
      this.startTimer(id);
    }
    
    // Trigger animation
    setTimeout(() => {
      notification.classList.add('popup-notify-visible');
    }, 10);
    
    // Play sound if enabled
    this.playSound(notificationOptions.type);
    
    return id;
  }

  /**
   * Create notification DOM element
   * @private
   * @param {Object} options - Notification options
   * @returns {HTMLElement} Notification element
   */
  createNotificationElement(options) {
    const notification = document.createElement('div');
    notification.className = `popup-notify-notification popup-notify-${options.type}`;
    notification.id = options.id;
    
    if (options.customClass) {
      notification.classList.add(options.customClass);
    }
    
    // Build notification content
    let content = `
      <div class="popup-notify-content">
        ${this.config.iconEnabled && !options.icon ? this.getDefaultIcon(options.type) : ''}
        ${options.icon ? `<div class="popup-notify-custom-icon">${options.icon}</div>` : ''}
        <div class="popup-notify-text-content">
          ${options.title ? `<div class="popup-notify-title">${options.title}</div>` : ''}
          <div class="popup-notify-message">${options.html ? options.message : this.escapeHtml(options.message)}</div>
        </div>
        ${options.showCloseButton ? '<button class="popup-notify-close" aria-label="Close">&times;</button>' : ''}
      </div>
    `;
    
    // Add action buttons if any
    if (options.actions && options.actions.length) {
      content += '<div class="popup-notify-actions">';
      options.actions.forEach((action, index) => {
        content += `<button class="popup-notify-action ${action.class || ''}" data-action-index="${index}">${action.label}</button>`;
      });
      content += '</div>';
    }
    
    // Add progress bar if enabled
    if (options.progress && options.duration > 0) {
      content += `<div class="popup-notify-progress"><div class="popup-notify-progress-bar" style="animation-duration: ${options.duration}ms"></div></div>`;
    }
    
    notification.innerHTML = content;
    
    // Attach event listeners
    this.attachEventListeners(notification, options);
    
    return notification;
  }

  /**
   * Attach event listeners to notification
   * @private
   * @param {HTMLElement} notification - Notification element
   * @param {Object} options - Notification options
   */
  attachEventListeners(notification, options) {
    // Click event
    if (options.closeOnClick || options.onClick) {
      notification.addEventListener('click', (e) => {
        // Don't close if clicking on action buttons
        if (e.target.classList.contains('popup-notify-action')) {
          return;
        }
        
        if (options.onClick) {
          options.onClick(options.id, options.data);
        }
        
        if (options.closeOnClick) {
          this.close(options.id);
        }
      });
    }
    
    // Close button
    const closeButton = notification.querySelector('.popup-notify-close');
    if (closeButton) {
      closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.close(options.id);
      });
    }
    
    // Action buttons
    const actionButtons = notification.querySelectorAll('.popup-notify-action');
    actionButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(button.getAttribute('data-action-index'));
        const action = options.actions[index];
        if (action && action.action) {
          action.action(options.id, options.data);
        }
        if (action && action.closeOnClick !== false) {
          this.close(options.id);
        }
      });
    });
    
    // Pause on hover
    if (options.pauseOnHover && options.duration > 0) {
      notification.addEventListener('mouseenter', () => {
        this.pauseTimer(options.id);
      });
      
      notification.addEventListener('mouseleave', () => {
        this.resumeTimer(options.id);
      });
    }
  }

  /**
   * Start timer for notification auto-close
   * @private
   * @param {string} id - Notification ID
   */
  startTimer(id) {
    const notification = this.activeNotifications.find(n => n.id === id);
    if (!notification) return;
    
    notification.timer = {
      startTime: Date.now(),
      remaining: notification.options.duration,
      timeoutId: setTimeout(() => {
        this.close(id);
      }, notification.options.duration)
    };
  }

  /**
   * Pause timer for notification
   * @private
   * @param {string} id - Notification ID
   */
  pauseTimer(id) {
    const notification = this.activeNotifications.find(n => n.id === id);
    if (!notification || !notification.timer) return;
    
    clearTimeout(notification.timer.timeoutId);
    notification.timer.remaining -= Date.now() - notification.timer.startTime;
    
    // Pause progress bar animation
    const progressBar = notification.element.querySelector('.popup-notify-progress-bar');
    if (progressBar) {
      const computedStyle = window.getComputedStyle(progressBar);
      progressBar.style.animationPlayState = 'paused';
    }
  }

  /**
   * Resume timer for notification
   * @private
   * @param {string} id - Notification ID
   */
  resumeTimer(id) {
    const notification = this.activeNotifications.find(n => n.id === id);
    if (!notification || !notification.timer) return;
    
    notification.timer.startTime = Date.now();
    notification.timer.timeoutId = setTimeout(() => {
      this.close(id);
    }, notification.timer.remaining);
    
    // Resume progress bar animation
    const progressBar = notification.element.querySelector('.popup-notify-progress-bar');
    if (progressBar) {
      progressBar.style.animationPlayState = 'running';
    }
  }

  /**
   * Close a notification
   * @param {string} id - Notification ID
   */
  close(id) {
    const index = this.activeNotifications.findIndex(n => n.id === id);
    if (index === -1) return;
    
    const notification = this.activeNotifications[index];
    
    // Clear timeout if exists
    if (notification.timer && notification.timer.timeoutId) {
      clearTimeout(notification.timer.timeoutId);
    }
    
    // Start closing animation
    notification.element.classList.remove('popup-notify-visible');
    notification.element.classList.add('popup-notify-closing');
    
    // Remove after animation completes
    setTimeout(() => {
      if (notification.element.parentNode) {
        notification.element.parentNode.removeChild(notification.element);
      }
      
      // Remove from active notifications
      this.activeNotifications.splice(index, 1);
      
      // Call onClose callback if provided
      if (notification.options.onClose) {
        notification.options.onClose(id, notification.options.data);
      }
    }, this.config.animationDuration);
  }

  /**
   * Close all notifications
   */
  closeAll() {
    const notifications = [...this.activeNotifications];
    notifications.forEach(notification => {
      this.close(notification.id);
    });
  }

  /**
   * Update an existing notification
   * @param {string} id - Notification ID
   * @param {Object} options - New options to apply
   */
  update(id, options = {}) {
    const notification = this.activeNotifications.find(n => n.id === id);
    if (!notification) return;
    
    // Update options
    notification.options = { ...notification.options, ...options };
    
    // Update title if provided
    if (options.title !== undefined) {
      const titleElement = notification.element.querySelector('.popup-notify-title');
      if (titleElement) {
        titleElement.innerHTML = options.title;
      } else if (options.title) {
        const textContent = notification.element.querySelector('.popup-notify-text-content');
        const titleDiv = document.createElement('div');
        titleDiv.className = 'popup-notify-title';
        titleDiv.innerHTML = options.title;
        textContent.prepend(titleDiv);
      }
    }
    
    // Update message if provided
    if (options.message !== undefined) {
      const messageElement = notification.element.querySelector('.popup-notify-message');
      if (messageElement) {
        messageElement.innerHTML = options.html ? options.message : this.escapeHtml(options.message);
      }
    }
    
    // Update type/appearance if provided
    if (options.type !== undefined) {
      notification.element.className = notification.element.className.replace(/popup-notify-(?:info|success|warning|error|custom)/, `popup-notify-${options.type}`);
      
      // Update icon if using default icons
      if (this.config.iconEnabled && !notification.options.icon) {
        const iconContainer = notification.element.querySelector('.popup-notify-icon');
        if (iconContainer) {
          iconContainer.innerHTML = this.getDefaultIcon(options.type);
        }
      }
    }
    
    // Update duration if provided
    if (options.duration !== undefined && options.duration !== notification.options.duration) {
      // Clear existing timer
      if (notification.timer && notification.timer.timeoutId) {
        clearTimeout(notification.timer.timeoutId);
      }
      
      // Start new timer if duration > 0
      if (options.duration > 0) {
        notification.timer = null;
        this.startTimer(id);
        
        // Update progress bar
        const progressContainer = notification.element.querySelector('.popup-notify-progress');
        if (progressContainer) {
          if (options.progress !== false) {
            // Replace progress bar with new duration
            progressContainer.innerHTML = `<div class="popup-notify-progress-bar" style="animation-duration: ${options.duration}ms"></div>`;
          } else {
            progressContainer.remove();
          }
        }
      } else {
        // Remove progress bar if duration set to 0
        const progressContainer = notification.element.querySelector('.popup-notify-progress');
        if (progressContainer) {
          progressContainer.remove();
        }
      }
    }
    
    // Update actions if provided
    if (options.actions !== undefined) {
      const actionsContainer = notification.element.querySelector('.popup-notify-actions');
      
      // Remove existing actions
      if (actionsContainer) {
        actionsContainer.remove();
      }
      
      // Add new actions if any
      if (options.actions && options.actions.length) {
        const newActionsContainer = document.createElement('div');
        newActionsContainer.className = 'popup-notify-actions';
        
        options.actions.forEach((action, index) => {
          const button = document.createElement('button');
          button.className = `popup-notify-action ${action.class || ''}`;
          button.setAttribute('data-action-index', index);
          button.textContent = action.label;
          
          button.addEventListener('click', (e) => {
            e.stopPropagation();
            if (action.action) {
              action.action(id, notification.options.data);
            }
            if (action.closeOnClick !== false) {
              this.close(id);
            }
          });
          
          newActionsContainer.appendChild(button);
        });
        
        notification.element.appendChild(newActionsContainer);
      }
    }
  }

  /**
   * Manage the maximum number of notifications
   * @private
   */
  manageNotificationLimit() {
    const maxNotifications = this.config.maxNotifications;
    if (maxNotifications <= 0) return;
    
    // Count total notifications across all positions
    const totalNotifications = this.activeNotifications.length;
    
    // Close oldest notifications if limit exceeded
    if (totalNotifications > maxNotifications) {
      const notificationsToRemove = totalNotifications - maxNotifications;
      
      // Get oldest notifications (if newestOnTop is true, otherwise get newest)
      const notificationsToClose = this.config.newestOnTop 
        ? this.activeNotifications.slice(-notificationsToRemove) 
        : this.activeNotifications.slice(0, notificationsToRemove);
      
      notificationsToClose.forEach(notification => {
        this.close(notification.id);
      });
    }
  }

  /**
   * Get default icon for notification type
   * @private
   * @param {string} type - Notification type
   * @returns {string} Icon HTML
   */
  getDefaultIcon(type) {
    const icons = {
      info: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"></path></svg>',
      success: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path></svg>',
      warning: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"></path></svg>',
      error: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path></svg>'
    };
    
    return `<div class="popup-notify-icon">${icons[type] || icons.info}</div>`;
  }

  /**
   * Play notification sound
   * @private
   * @param {string} type - Notification type
   */
  playSound(type) {
    if (!this.config.soundEnabled || !this.config.soundPath) return;
    
    const sound = new Audio(`${this.config.soundPath}/${type}.mp3`);
    sound.play().catch(e => {
      console.warn('PopupNotify: Error playing notification sound', e);
    });
  }

  /**
   * Escape HTML to prevent XSS
   * @private
   * @param {string} html - String to escape
   * @returns {string} Escaped string
   */
  escapeHtml(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  /**
   * Shorthand method for success notifications
   * @param {string} message - Notification message
   * @param {string} title - Notification title
   * @param {Object} options - Additional options
   * @returns {string} Notification ID
   */
  success(message, title = '', options = {}) {
    return this.show({ ...options, type: 'success', message, title });
  }

  /**
   * Shorthand method for error notifications
   * @param {string} message - Notification message
   * @param {string} title - Notification title
   * @param {Object} options - Additional options
   * @returns {string} Notification ID
   */
  error(message, title = '', options = {}) {
    return this.show({ ...options, type: 'error', message, title });
  }

  /**
   * Shorthand method for warning notifications
   * @param {string} message - Notification message
   * @param {string} title - Notification title
   * @param {Object} options - Additional options
   * @returns {string} Notification ID
   */
  warning(message, title = '', options = {}) {
    return this.show({ ...options, type: 'warning', message, title });
  }

  /**
   * Shorthand method for info notifications
   * @param {string} message - Notification message
   * @param {string} title - Notification title
   * @param {Object} options - Additional options
   * @returns {string} Notification ID
   */
  info(message, title = '', options = {}) {
    return this.show({ ...options, type: 'info', message, title });
  }

  /**
   * Set global configuration
   * @param {Object} options - Configuration options
   */
  setConfig(options = {}) {
    this.config = { ...this.config, ...options };
    
    // Update theme if changed
    if (options.theme) {
      this.mainContainer.setAttribute('data-theme', options.theme);
    }
  }

  /**
   * Get current configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Destroy the notification system
   * Removes all notifications and event listeners
   */
  destroy() {
    // Close all notifications
    this.closeAll();
    
    // Remove container after animations complete
    setTimeout(() => {
      if (this.mainContainer && this.mainContainer.parentNode) {
        this.mainContainer.parentNode.removeChild(this.mainContainer);
      }
    }, this.config.animationDuration);
  }
}

// Export as module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PopupNotify;
} else if (typeof define === 'function' && define.amd) {
  define([], function() {
    return PopupNotify;
  });
} else {
  window.PopupNotify = PopupNotify;
}

if (typeof window !== "undefined" && !window.popupNotifier) {
  window.popupNotifier = new PopupNotify();
}

