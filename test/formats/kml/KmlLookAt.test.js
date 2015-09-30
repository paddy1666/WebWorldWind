/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
require({
    baseUrl: '/test/'
}, [
    'test/CatchTest',
    'src/formats/kml/KmlLookAt',
    'src/util/XmlDocument'
], function (
    CatchTest,
    KmlLookAt,
    XmlDocument
) {
    "use strict";
    TestCase("KmlCameraTest", {
        testValidKml: CatchTest(function () {
            var validKml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
                "<kml xmlns=\"http://www.opengis.net/kml/2.2\">" +
                "<LookAt>" +
                "   <longitude>10</longitude>" +
                "   <latitude>9</latitude>" +
                "   <altitude>8</altitude>" +
                "   <heading>1</heading>" +
                "   <tilt>7</tilt>" +
                "   <range>6</range>" +
                "   <altitudeMode>clampToGround</altitudeMode>" +
                "</LookAt>" +
                "</kml>";
            var kmlRepresentation = new XmlDocument(validKml).dom();
            var lookAt = new KmlLookAt(
                kmlRepresentation.getElementsByTagName("LookAt")[0]);

            assertEquals(10, lookAt.longitude);
            assertEquals(9, lookAt.latitude);
            assertEquals(8, lookAt.altitude);
            assertEquals(1, lookAt.heading);
            assertEquals(7, lookAt.tilt);
            assertEquals(6, lookAt.range);
            assertEquals("clampToGround", lookAt.altitudeMode);
        })
    })
});