 const [listOfLocations, setListOfLocations] = useState([]);

 const geocoder = new window.google.maps.Geocoder();
geocoder.geocode({ location }, (results, status) => {
    if (status === "OK") {
    if (results[0]) {
        setListOfLocations((prevList) => [
        ...prevList,
        { name: results[0].formatted_address, location },
        ]);
    } else {
        console.error("No results found");
    }
    } else {
    console.error("Geocoder failed due to: " + status);
    }
});

const onDeleteLocation = (loc) => {
    const updatedList = listOfLocations.filter(
        (l) => !(loc.lat === l.location.lat && loc.lng === l.location.lng)
    );
    setListOfLocations(updatedList);

    // Clear marker if the deleted location was being viewed.
    if (markerLocation && loc.lat === markerLocation.lat && loc.lng === markerLocation.lng) {
        setMarkerLocation(null);
    }
    };