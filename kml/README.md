Questions which we must answer:
  - How will we get the applied styles?
  - How will we update the objects which updates periodically?
    - What objects can update periodically?
      - All Features at least can be updated periodically by downloading new data.
  - How exactly will be the objects rendered?

KmlFile will become renderable regardless of the approach.


/* Approach with renderables tight together by the KmlFile */
User creates the KmlFile with needed parameters. It downloads the data from the Remote location.
 - Should we parse the data upfront or when the KmlFile is added to the layer?
   - I would parse the data upfront and create internal structure, which represents the file.
   - Changes in this structure will trigger rendering of the objects by calling render on kmlFile? This
     would mean we will have to retain link to the KmlFile or some Dispatcher
 - Styles that should be applied are anywhere in the hierarchy, but the features actually use either
   actual styles or styles referenced by id. The issue is that via NetworkLink the styles can change?
   - Can they really change?
   - Nope. Once you resolved styling for the element, then the element remain styled in this way.
 - Objects, which will be rendered as itself because they will have counterpart in the WorldWind
   implementation.
 - Objects which when rendered somehow modify the visible space of the WorldWind e.g. LookAt - There is
   again an issue with dependency upon current window, which is fine layer keeps this information or not?
 - KmlFile rendering will cascade down the line. This means that KmlFile must retain information.
   Therefore this approach will contain two hierarchies - Renderables and Parsers.


/* Approach with renderables being created by listeners/factories */
User creates the KmlFile with needed parameters. It downloads the data from the Remote location.
Once the data are downloaded, we start parsing them. Parsing is done inside of the KmlFile. It is
 recursive operation.
If the element is valid KmlElement we create an event with current node to the EventEmitter. Registered
 factories are then called with the node. If they understand this node, they parse it and create valid
Renderable. This renderable will be added to the KmlFile renderable.