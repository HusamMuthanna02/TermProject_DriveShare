// Mediator Pattern 
class UIMediator {
    constructor() {
        this.components = {};
    }

    registerComponent(name, component) {
        this.components[name] = component;
        component.setMediator(this);
    }

    notify(sender, event, data) {
        switch (event) {
            case 'updateNotifications':
                if (this.components['notifications']) {
                    this.components['notifications'].update(data);
                }
                break;
            case 'updateBalance':
                if (this.components['balance']) {
                    this.components['balance'].update(data);
                }
                break;
            case 'newMessage':
                if (this.components['messages']) {
                    this.components['messages'].addMessage(data);
                }
                break;
            case 'updateProfile':
                if (this.components['profile']) {
                    this.components['profile'].update(data);
                }
                break;
            case 'refreshCarListings':
                if (this.components['carListings']) {
                    this.components['carListings'].refresh(data);
                }
                break;
            case 'displayError':
                if (this.components['errorHandler']) {
                    this.components['errorHandler'].showError(data);
                }
                break;
            case 'updateBookingStatus':
                if (this.components['bookings']) {
                    this.components['bookings'].updateStatus(data);
                }
                break;
        }
    }
}

module.exports = UIMediator;
