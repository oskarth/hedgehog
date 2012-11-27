(ns hedgehog.core
  (:require [clojure.browser.event :as event]
            [clojure.browser.dom :as dom]
            [crate.core :as crate]))


(def document js/document)
(def body (.-body document))

(def dom-state (atom {:focus nil}))

;; selectors
(defn get-element-index
  "gets index of element in relation to its siblings"
  [el]
  (let [siblings (js->clj (js/Array.prototype.slice.call
                           (-> el .-parentNode .-childNodes)))]
    (count (take-while (partial not= el) siblings))))
                    
(defn get-element-path
  "get xpath of a dom element"
  [el]
  (let [parent (.-parentNode el)
        tagname (.-tagName el)]
  (cond
   (not= (.-id el) "") (str "id(\"" (.-id el) "\")")
   (= el body) tagname
   :else
     (str (get-element-path parent)
          "/" tagname
          "[" (get-element-index el) "]"))))

(defn get-element
  [xpath]
  (.iterateNext
    (.evaluate document xpath document nil js/XPathResult.ANY_TYPE nil)))

;; core
(defn render [template new-val]
  (let [focus (:focus @dom-state)]
    (dom/replace-node
     (dom/get-element "content")
     (crate/html
      [:div#content
       (template new-val)]))
    (when focus
      (.focus (get-element focus)))))

(defn init [template state]
  (dom/insert-at
    body
    (dom/element :div {:id "content"})
    0)
  (add-watch state nil
    (fn [k a old-val new-val]
      (render template new-val)))
  (render template @state))

;; event handlers?
(defn focus-event
  "saves focused dom element in dom-state atom"
  [ev]
  (let [xpath (get-element-path (-> ev .-target))]
    (swap! dom-state assoc :focus xpath)))

(defn blur-event
  "remove previously focused dom element from dom-state atom"
  [ev]
  (swap! dom-state assoc :focus nil))

(event/listen body :focus focus-event true)
(event/listen body :blur blur-event true)