// Builder Pattern for creating car listings

class CarListingBuilder {
    constructor() {
        this.carListing = {};
    }

    setOwnerUsername(ownerUsername) {
        this.carListing.ownerUsername = ownerUsername;
        return this;
    }

    setModel(model) {
        this.carListing.model = model;
        return this;
    }

    setYear(year) {
        this.carListing.year = year;
        return this;
    }

    setMileage(mileage) {
        this.carListing.mileage = mileage;
        return this;
    }

    setPickupLocation(pickupLocation) {
        this.carListing.pickupLocation = pickupLocation;
        return this;
    }

    setRentalPrice(rentalPrice) {
        this.carListing.rentalPrice = rentalPrice;
        return this;
    }

    setAvailability(availability) {
        this.carListing.availability = availability;
        return this;
    }

    build() {
        return this.carListing;
    }
}

module.exports = CarListingBuilder;