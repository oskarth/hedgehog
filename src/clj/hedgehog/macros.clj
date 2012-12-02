(ns hedgehog.macros
  (:use [reflex.macros :only [computed-observable]]))

(defmacro defo
  "defines observable"
  [name body]
  `(def ~name (atom ~body)))

(defmacro defco
  "defined computed observables"
  [name expr]
  `(def ~name (computed-observable ~expr)))

;; test data
(def foo-body '
  [:div#todos
    [:ul
      (map todo-element @todos)
      (when-not (empty? @pending-todo)
        (todo-element @pending-todo))]
    [:input#input
     {:value @pending-todo
      :bind-value @pending-todo
       :type "text"
       :autofocus "true"}]
   [:input {:value @pending-todo}]
   [:button "Add"]])

(defn deref? [form]
  (= "clojure.core/deref" (str form)))

(defn- eval-to-map? [form]
  (and (fn? form) (map? (form))))

(defn elem-with-attr? [form]
  (and (vector? form)
       (keyword? (first form))
       (or (map? (second form))
           (eval-to-map? (second form)))))

;; TODO
(defn bind-val? [form]
  (and (elem-with-attr? form)
       (get :bind-value form)))

(defn walky [form]
  (clojure.walk/postwalk
   (fn [f]
     (if (bind-val? f)
       ["ELEM " f] f)) form))