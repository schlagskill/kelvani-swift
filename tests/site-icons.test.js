import test from 'node:test';
import assert from 'node:assert/strict';
import {faviconUrl,siteIcon} from '../site-icons.js';
const runtime={id:'test',getURL:path=>'chrome-extension://test/'+path};
class Node{
 constructor(tag){this.tag=tag;this.children=[];this.events={};this.hidden=false;}
 setAttribute(key,value){this[key]=value;}
 append(child){child.parent=this;this.children.push(child);}
 addEventListener(key,listener){this.events[key]=listener;}
 remove(){this.parent.children=this.parent.children.filter(child=>child!==this);}
}
const doc={createElement:tag=>new Node(tag)};
test('favicon cache URL retains the website URL without leaking it to a third party',()=>{
 const result=new URL(faviconUrl('https://www.youtube.com/watch?v=a&list=b#section',runtime));
 assert.equal(result.protocol,'chrome-extension:');assert.equal(result.hostname,'test');assert.equal(result.pathname,'/_favicon/');assert.equal(result.searchParams.get('pageUrl'),'https://www.youtube.com/watch?v=a&list=b');assert.equal(result.searchParams.get('size'),'32');
});
test('unsafe URLs and browser preview never request external icons',()=>{
 for(const url of ['javascript:alert(1)','file:///private','https://user:secret@example.com'])assert.equal(faviconUrl(url,runtime),null);
 assert.equal(faviconUrl('https://example.com',null),null);
 const node=siteIcon('https://youtube.com',null,doc);assert.equal(node.children.length,1);assert.equal(node.children[0].textContent,'Y');
});
test('website favicon replaces the fallback only after successful loading',()=>{
 const node=siteIcon('https://youtube.com',runtime,doc);const [fallback,image]=node.children;
 assert.equal(image.hidden,true);assert.equal(fallback.hidden,false);image.events.load();assert.equal(image.hidden,false);assert.equal(fallback.hidden,true);assert.equal(image.alt,'');
});
test('failed or unavailable favicon leaves a clean hostname fallback',()=>{
 const node=siteIcon('https://www.example.com',runtime,doc);const [fallback,image]=node.children;image.events.error();assert.equal(node.children.length,1);assert.equal(fallback.textContent,'E');assert.equal(fallback.hidden,false);
});
