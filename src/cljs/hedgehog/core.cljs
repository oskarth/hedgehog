(ns hedgehog.core
  (:require [clojure.browser.event :as event]
            [clojure.browser.dom :as dom]
            [crate.core :as crate]))

(def body (.-body js/document))

(def dom-state (atom {:focus nil}))

(defn render [template new-val]
  (let [focus (:focus @dom-state)]
    (dom/log "MY FOCUS MY FOCUS WHAT HAVE YE DONE WITH MY FOCUS?")
    (dom/log focus)
    (dom/replace-node
     (dom/get-element "content")
     (crate/html
      [:div#content
       (template new-val)]))
    (dom/log "MY FOCUS HERE? " focus)
    (when focus
      (. focus focus))))

(defn init [template state]
  (dom/insert-at
    js/document.body
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
  (let [target (-> ev .-target)]
    (swap! dom-state assoc :focus target)
    (dom/log @dom-state)))

(defn blur-event
  "remove previously focused dom element from dom-state atom"
  [ev]
  (swap! dom-state assoc :focus nil)
  (dom/log @dom-state))

(event/listen body :focus focus-event true)
(event/listen body :blur blur-event true)

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
   (= el (.-body js/document)) tagname
   :else
   (str (get-element-path parent)
        "/" tagname
        "[" (get-element-index el) "]"))))