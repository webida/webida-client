Parse Result Model
============================================
array of
{
  type : one of ["text", "directive",  "comment",  "script",  "style", "tag",  "cdata"]

  // in case of type is one of ["tag", "script", "stype"]
  name : name of node
  attribs : object with properties which key is attribute name and value is attribute value
  children : array of node
  prev : prev node
  next : next node
  parent : parent node

  // in case of type is one of ["text", "comment"]
  data : value of node

  // in case of type is "cdata"
  children : text node

  // in case of type is "directive"
  name : name of node
  data : value of node
}


Upstream
============================================
* Upstream URLs
** https://github.com/fb55/htmlparser2
** https://github.com/fb55/domhandler
** https://github.com/fb55/DomElementType

* Upstream date
** 2013/09/12

How to merge from latest upstream
============================================
1. Checkout lib-htmlparser2 branch
2. Update source with latest upstream source
3. Commit changes
4. Checkout master branch
5. Merge lib-htmlparser2 branch into master branch
