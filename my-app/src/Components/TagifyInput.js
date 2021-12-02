import React, { useRef, useMemo, useEffect, useState } from 'react';
import Tags from "@yaireo/tagify/dist/react.tagify" // React-wrapper file
import "@yaireo/tagify/dist/tagify.css" // Tagify CSS
import DragSort from '@yaireo/dragsort'
import '@yaireo/dragsort/dist/dragsort.css'

const tagifySettings = {
    placeholder: "Choose at most 5 parameters to visualize in the plot",
    maxTags: 5,
    enforceWhitelist: true,
    tagTextProp: 'name',
    duplicates: false,
    dropdown: {
        mapValueTo: 'name',
        enabled: 0,
        closeOnSelect: true,
        maxItems: 30,
        searchKeys: ['name']
    }
};

const TagifyInput = (props) => {
    const onKeysSelected = props.onKeysSelected;
    const whiteList = props.whiteList;

    // Tagfiy
    const tagifyRef = useRef();

    // bind "DragSort" to Tagify's main element and tell
    // it that all the items with the below "selector" are "draggable".
    // This is done inside a `useMemo` hook to make sure it gets initialized
    // only when the ref updates with a value ("current")
    useMemo(() => {
        if(  tagifyRef.current )
            new DragSort(tagifyRef.current.DOM.scope, {
            selector: '.tagify__tag',
            callbacks: {
                dragEnd: onDragEnd
            }
        })
    }, [tagifyRef.current]);

    // must update Tagify's value according to the re-ordered nodes in the DOM
    function onDragEnd(e){
        tagifyRef.current.updateValueByDOMTags()
    };

    // Function to change the keys (axes)
    const changeKeys = (e) => {
        // If no parameters selected, return []
        let k = (e.detail.value).length > 0 ? JSON.parse(e.detail.value) : [];
        let newKeys = k.map(d => d.value)
        onKeysSelected(newKeys)
    };

    return (
        <Tags
            tagifyRef={tagifyRef} 
            onChange={(e) => changeKeys(e)} 
            settings={tagifySettings}   
            whitelist={whiteList}
            autoFocus={true}
        />
    )
}

export default TagifyInput;