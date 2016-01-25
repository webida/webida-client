/*
 * Copyright (c) 2012-2015 S-Core Co., Ltd.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * http://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html
 */

/**
 * @file
 * HTML DOM implementation module
 * http://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html
 *
 * @constructor
 * @since 1.0.0
 * @author changhun.lim@samsung.com
 * @author hyunik.na@samsung.com
 *
 */

define([], function () {
    'use strict';

    var inherits = (function () {
        var Temp = function () {
        };

        return function (constructor, superConstructor) {
            Temp.prototype = superConstructor.prototype;
            constructor.prototype = new Temp();
        };
    }());

    var NodeList = function () {};

    inherits(NodeList, Array);


    var Node = function () {
        this.nodeName = null;
        this.nodeValue = null;
        this.nodeType = null;
        this.parentNode = null;
        this.childNodes = new NodeList();
        this.firstChild = null;
        this.lastChild = null;
        this.previousSibling = null;
        this.nextSibling = null;
        this.attributes = null;
        this.ownerDocument = null;

        // non-standard
        this.children = this.childNodes;
    };

    Node.ELEMENT_NODE = 1;
    Node.ATTRIBUTE_NODE = 2;
    Node.TEXT_NODE = 3;
    Node.CDATA_SECTION_NODE = 4;
    Node.ENTITY_REFERENCE_NODE = 5;  // TODO implement
    Node.PROCESSING_INSTRUCTION_NODE = 7;
    Node.COMMENT_NODE = 8;
    Node.DOCUMENT_NODE = 9;
    Node.DOCUMENT_TYPE_NODE = 10;
    Node.DOCUMENT_FRAGMENT_NODE = 11;  // TODO implement
    Node.NOTATION_NODE = 12;  // TODO implement


    Node.prototype.appendChild = function (child) {
        return this.insertBefore(child, null);
    };

    // TODO implement DOM spec 1
    // this.cloneNode()
    // this.compareDocumentPosition()

    Node.prototype.hasAttributes = function () {
        return this.attributes && this.attributes.length > 0;
    };

    Node.prototype.hasChildNodes = function () {
        return this.childNodes.length > 0;
    };

    Node.prototype.insertBefore = function (newnode, existingnode) {
        // TODO check this.nodeType whether it can have child.nodeType chlid
        // TODO check this has existingnode

        if (newnode.parentNode) {
            newnode.parentNode.removeChild(newnode);
        }

        var existingnodeIndex = this.childNodes.indexOf(existingnode);

        if (existingnodeIndex < 0) {
            this.childNodes.push(newnode);

            newnode.parentNode = this;
            newnode.previousSibling = this.lastChild;
            newnode.nextSibling = null;

            if (this.firstChild === null) {
                this.firstChild = newnode;
            }
            if (this.lastChild !== null) {
                this.lastChild.nextSibling = newnode;
            }
            this.lastChild = newnode;

        } else {
            newnode.parentNode = this;
            newnode.previousSibling = existingnode.previousSibling;
            newnode.nextSibling = existingnode;

            if (existingnode.previousSibling !== null) {
                existingnode.previousSibling.nextSibling = newnode;
            }
            existingnode.previousSibling = newnode;

            if (this.firstChild === existingnode) {
                this.firstChild = newnode;
            }
        }

        return newnode;
    };

    Node.prototype.removeChild = function (node) {
        var index = this.childNodes.indexOf(node);
        if (index < 0) {
            return null;
        }

        this.childNodes.splice(index, 1);

        if (this.firstChild === node) {
            this.firstChild = node.nextSibling;
        }
        if (this.lastChild === node) {
            this.lastChild = node.previousSibling;
        }

        node.parentNode = null;
        node.previousSibling = null;
        node.nextSibling = null;

        return node;
    };

    Node.prototype.replaceChild = function (newnode, oldnode) {
        var index = this.childNodes.indexOf(oldnode);
        if (index < 0) {
            return null;
        }

        if (newnode.parentNode) {
            newnode.parentNode.removeChild(newnode);
        }

        this.childNodes.splice(index, 1, newnode);

        if (this.firstChild === oldnode) {
            this.firstChild = newnode;
        }
        if (this.lastChild === oldnode) {
            this.lastChild = newnode;
        }

        newnode.parentNode = this;
        newnode.previousSibling = oldnode.previousSibling;
        newnode.nextSibling = oldnode.nextSibling;

        return oldnode;
    };

    Node.prototype._setOwnerDocument = function (ownerDoc, deep) {
        this.ownerDocument = ownerDoc;
        if (deep) {
            for (var i = 0; i < this.childNodes.length; i++) {
                this.childNodes[i]._setOwnerDocument(ownerDoc, deep);
            }
        }
    };



    var CharacterData = function () {
        Node.call(this);

        //this.nodeType;
        //this.nodeName;
        this.nodeValue = '';

        this.data = '';
    };

    inherits(CharacterData, Node);

    // TODO implement DOM spec 1
    // substringData()
    // appendData()
    // insertData()
    // deleteData()
    // replaceData()

    // non-standard
    CharacterData.prototype.setValue = function (value) {
        this.nodeValue = value;
        this.data = value;
    };



    var Text = function () {
        CharacterData.call(this);

        this.nodeType = Node.TEXT_NODE;
        this.nodeName = '#text';
        this.nodeValue = null;
    };

    inherits(Text, CharacterData);



    var CDATASection = function () {
        Text.call(this);

        this.nodeType = Node.CDATA_SECTION_NODE;
        this.nodeName = '#cdata-section';
        this.nodeValue = null;
    };

    inherits(CDATASection, Text);



    var ProcessingInstruction = function () {
        Node.call(this);

        this.nodeType = Node.PROCESSING_INSTRUCTION_NODE;
        this.nodeName = null;
        this.nodeValue = null;

        this.target = null;
    };

    inherits(ProcessingInstruction, Node);

    // non-standard setter function
    ProcessingInstruction.prototype._setNodeName =
    ProcessingInstruction.prototype._setTarget = function (target) {
        this.target = this.nodeName = target;
    };

    // non-standard setter function
    ProcessingInstruction.prototype._setNodeValue = function (value) {
        this.nodeValue = value;
    };


    var Comment = function () {
        CharacterData.call(this);

        this.nodeType = Node.COMMENT_NODE;
        this.nodeName = '#comment';
        this.nodeValue = null;
    };

    inherits(Comment, CharacterData);



    var Attribute = function (name) {
        Node.call(this);

        this.nodeType = Node.ATTRIBUTE_NODE;
        this.nodeName = name;
        this.nodeValue = null;

        this.name = name;
        this.value = null;

        // TODO implemented DOM 1 spec
        // this.specified = false;
    };

    inherits(Attribute, Node);

    // non-standard setter function
    Attribute.prototype.setValue = function (value) {
        this.value = value;
        this.nodeValue = value;
    };



    var NamedNodeMap = function () {};

    inherits(NamedNodeMap, Array);

    NamedNodeMap.prototype.getNamedItem = function (name) {
        for (var i = 0; i < this.length; i++) {
            if (this.item(i).name === name) {
                return this.item(i);
            }
        }
        return null;
    };

    NamedNodeMap.prototype.item = function (index) {
        return this[index];
    };

    NamedNodeMap.prototype.removeNamedItem = function (name) {
        var nodeToReturn = null;
        for (var i = 0; i < this.length; i++) {
            if (this.item(i).name === name) {
                nodeToReturn = this.item(i);
                this.splice(i, 1);
            }
        }
        return nodeToReturn;
    };

    NamedNodeMap.prototype.setNamedItem = function (node) {
        for (var i = 0; i < this.length; i++) {
            if (this.item(i).name === node.name) {
                var nodeToReturn = this.item(i);
                this.splice(i, 1, node);
                return nodeToReturn;
            }
        }

        this.push(node);
        return null;
    };



    var Element = function (tagName) {
        Node.call(this);

        this.attributes = new NamedNodeMap();

        this.nodeType = Node.ELEMENT_NODE;
        this.nodeName = tagName;
        this.nodeValue = null;

        this.tagName = '';
        this._innerHtml = null;

        if (tagName) {
            this.setTagName(tagName);
        }
    };

    inherits(Element, Node);

    Element.prototype.getAttribute = function (name) {
        if (this.attributes) {
            var attr = this.attributes.getNamedItem(name);
            if (attr) {
                return attr.value;
            }
        }
        return null;
    };

    Element.prototype.getAttributeNode = function (name) {
        return this.attributes && this.attributes.getNamedItem(name);
    };

    /**
     * Walk element in pre-order traversal
     * @param {Element|NodeList} elem - Parent element or node list
     **/
    function walkElements(elem, c) {
        if (!elem) {
            return;
        }

        if (elem.nodeType === Node.ELEMENT_NODE) {
            c(elem);
        }

        var children = elem.length ? elem : elem.children;

        if (children) {
            for (var i = 0; i < children.length; i++) {
                walkElements(children[i], c);
            }
        }
    }

    /**
     * Returns a NodeList of all descendant elements with a given tag name
     * , in the order in which they would be encountered in a preorder traversal of the Element tree.
     *
     * @param {string} name - The name of the tag to match on. The special value "*" matches all tags
     * @return {NodeList} A list of matching Element nodes
     **/
    Element.prototype.getElementsByTagName = function (name) {
        var list = new NodeList();
        if (name === '*') {
            walkElements(this, function (elem) {
                list.push(elem);
            });
        } else {
            name = name.toUpperCase();
            walkElements(this, function (elem) {
                if (elem.tagName === name) {
                    list.push(elem);
                }
            });
        }
        return list;
    };

    Element.prototype.hasAttribute = function (attributename) {
        return this.attributes && this.attributes.getNamedItem(
            attributename) !== null;
    };

    Element.prototype.removeAttribute = function (name) {
        if (this.attributes) {
            this.removeAttributeNode(this.attributes.getNamedItem(name));
        }
    };

    Element.prototype.removeAttributeNode = function (node) {
        if (this.attributes && node) {
            var existing = this.attributes.getNamedItem(node.name);
            if (existing === node) {
                this.attributes.removeNamedItem(node.name);
                node.parentNode = null;
                return node;
            }
        }
    };

    Element.prototype.setAttribute = function (name, value) {
        var attr = null;

        if (this.attributes === null) {
            this.attributes = new NamedNodeMap();
        } else {
            attr = this.getAttributeNode(name);
        }

        if (attr !== null) {
            attr.setValue(value);
        } else {
            attr = new Attribute(name);
            attr.setValue(value);
            attr.parentNode = this;
            this.attributes.setNamedItem(attr);
        }
    };

    Element.prototype.setAttributeNode = function (node) {
        var existing = null;

        if (this.attributes === null) {
            this.attributes = new NamedNodeMap();
        } else {
            existing = this.attributes.getNamedItem(node.name);
            if (existing) {
                this.attributes.removeNamedItem(node.name);
            }
        }

        this.attributes.setNamedItem(node);

        return existing;
    };


    // non-standard

    Element.prototype.setTagName = function (name) {
        this.tagName = name.toUpperCase();
        this.nodeName = this.tagName;
    };

    Element.prototype.setInnerHtml = function (innerHtml) {
        // TODO regenerate child nodes
        this.childNodes = new NodeList();
        this.firstChild = null;
        this.lastChild = null;

        this._innerHtml = innerHtml;
    };

    /*
    Element.prototype.getInnerHtml = function () {
        // TODO implement

//        if (this._innerHtml) {
//            return this._innerHtml;
//        } else {
//            var serializer = new DefaultSerializer();
//            return serializer.serialize(this.childNodes);
//        }
    };

    Element.prototype.setInnerText = function (innerText) {
        // TODO implement

//        this.setInnerHtml(escape(innerText));
    };

    Element.prototype.getInnerText = function () {
        // TODO implement

//        if (this._innerHtml) {
//            return unescape(this._innerHtml);
//        } else {
//            var text = '';
//            this.childNodes.forEach(function (n) {
//                if (n instanceof Text) {
//                    text += n.getValue();
//                }
//            });
//            return text;
//        }
    };

     */


    var Document = function () {
        Node.call(this);

        this.nodeType = Node.DOCUMENT_NODE;
        this.nodeName = '#document';
        this.nodeValue = null;

        this.documentElement = null;

        // TODO implement DOM spec 1
        // this.doctype
        // this.implementation
    };

    inherits(Document, Node);

    Document.prototype.createAttribute = function (name) {
        var attr = new Attribute(name);
        return attr;
    };

    Document.prototype.createCDATASection = function (data) {
        var cdata = new CDATASection();
        cdata.setValue(data);
        return cdata;
    };

    Document.prototype.createComment = function (data) {
        var comment = new Comment();
        comment.setValue(data);
        return comment;
    };

    // TODO implement DOM spec 1
    // this.createDocumentFragment
    // this.createEntityReference

    Document.prototype.createElement = function (tagName) {
        var elem = new Element(tagName);
        return elem;
    };

    Document.prototype.createTextNode = function (data) {
        var text = new Text();
        text.setValue(data);
        return text;
    };


    Document.prototype.appendChild = function (newChild) {
        if (newChild.tagName === 'HTML') {
            this.documentElement = newChild;
        }

        return Node.prototype.appendChild.call(this, newChild);
    };

    Document.prototype.insertBefore = function (newChild, refChild) {
        if (newChild.tagName === 'HTML') {
            this.documentElement = newChild;
        }

        return Node.prototype.insertBefore.call(this, newChild, refChild);
    };

    Document.prototype.removeChild = function (oldChild) {
        if (this.documentElement === oldChild) {
            this.documentElement = null;
        }

        return Node.prototype.removeChild.call(this, oldChild);
    };

    Document.prototype.replaceChild = function (newChild, oldChild) {
        if (newChild.tagName === 'HTML') {
            this.documentElement = newChild;
        } else {
            this.documentElement = null;
        }

        return Node.prototype.replaceChild.call(this, newChild, oldChild);
    };

    /**
     * Returns a NodeList of all the Elements with a given tag name
     * in the order in which they would be encountered in a preorder traversal of the Document tree
     *
     * @param {string} name - The name of the tag to match on. The special value "*" matches all tags
     * @return {NodeList} A new NodeList object containing all the matched elements
     **/
    Document.prototype.getElementsByTagName = function (name) {
        var list = new NodeList();
        if (this.childNodes) {
            for (var i = 0; i < this.childNodes.length; i++) {
                if (this.childNodes[i].nodeType === Node.ELEMENT_NODE) {
                    var sublist = this.childNodes[i].getElementsByTagName(name);
                    for (var j = 0; j < sublist.length; j++) {
                        list.push(sublist[j]);
                    }
                }
            }
        }
        return list;
    };


    var DocumentType = function () {
        Node.call(this);

        this.nodeType = Node.DOCUMENT_TYPE_NODE;
        this.nodeName = null;
        this.nodeValue = null;

        this.name = null;
        // TODO impl entities, notations
    };

    inherits(DocumentType, Node);

    // non-standard
    DocumentType.prototype._setNodeName =
    DocumentType.prototype._setName = function (name) {
        this.nodeName = this.name = name;
    };



    return {
        Node : Node,
        Element : Element,		// 1
        Attribute : Attribute,	// 2
        Text : Text,			// 3
        CDATASection : CDATASection, // 4
        ProcessingInstruction : ProcessingInstruction, // 7
        Comment : Comment,		// 8
        Document : Document,	// 9
        DocumentType : DocumentType // 10
    };
});
