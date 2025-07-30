I'd like to rethink the import functionality. As of right now it just completely overrides everything right? Would it be possible for us to have a smarter/more structured import and export? The sync is always going to be everything I think, that's it's point. Up until now we've only thought of the import export as backup and recovery as well. What if instead of everything we gave the user the ability to export these aspectes individually:
User(2)
Actvity Cards
Activity Library Categories/Routines

This could then allow for easy sharing of cards, transfer of users. Export should show a list of attributes available for export to be checked or obviously all can still be checked. On import it would list the available data to be imported and the user should have the ability to individually select all elements but also the user should be given the option to "Start Fresh with Import", "Merge with Import", the merge with import would allow the user to keep their existing data but then also choose form the import what they would like to add to their existing implementation.

When making the UI take extra care to get the design right from the get go. Review thoroughly the StackMap documentation around sytling and ensure that this import functionality is built into a modal that is similiar to the others, specifically the close day modal might give some inspiration. It wouldn't be that exact implementation, but it is an example of a more complex activity happening within a scrolling modal
