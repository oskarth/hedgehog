(ns hedgehog.todos
  (:use-macros
   ;;[reflex.macros :only [computed-observable constrain!]]
   [hedgehog.macros :only [defo defco]])
  (:require
   [clojure.browser.dom :as dom]
   [clojure.browser.event :as event]
   [reflex.core :as reflex]
   [hedgehog.core :as hedgehog]))

(defo todos ["buy milk" "eat lunch" "drink milk"])
(defo pending-todo "foo bar")

(defco first-todo (first @todos))
(defco num-todos (count @todos))

(defco state {:todos @todos
              :pending-todo @pending-todo})

(defn add-todo! [todo]
  (swap! todos conj todo))

(defn todo-element [todo]
  [:li.todo todo])

(defn template [state]
  [:div#todos
    [:ul (map todo-element @todos)]
    [:input#input
      {:value @pending-todo
       :type "text"
       :autofocus "true"}]
   [:button "Add" (comment {:mouse-event add-todo!})]
   [:span @pending-todo]])

(defn title [state]
  (str "Todos" (when-not (zero? @num-todos) (str " (" @num-todos ")"))))

(defn input-event
  "too specific"
  [ev]
  (let [val (-> ev .-target .-value)]
    (reset! pending-todo val)))

(hedgehog/dom-ready!
 (fn []
  (hedgehog/init! template title state)
  (event/listen (hedgehog/body) :input input-event true)))